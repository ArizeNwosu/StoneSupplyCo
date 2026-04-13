import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Lead, Task, Template, Vertical } from '../types';
import { mockLeads } from '../data/mockData';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, writeBatch, query, where, setDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { scanForLeads } from '../services/geminiService';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: any[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserSettings {
  autoScanEnabled: boolean;
  autoScanFrequencyHours: number;
  lastScanTime: number | null;
  autoScanPrompt: string;
  displayName: string;
  companyName: string;
  territory: string;
  specializations: Vertical[];
  emailSignature: string;
}

interface LeadContextType {
  leads: Lead[];
  updateLeadStatus: (leadId: string, status: Lead['status']) => void;
  addTask: (leadId: string, task: Omit<Task, 'id'>) => void;
  toggleTask: (leadId: string, taskId: string) => void;
  deleteLeads: (leadIds: string[]) => void;
  updateLeadsStatus: (leadIds: string[], status: Lead['status']) => void;
  assignLeadsTerritory: (leadIds: string[], territory: string) => void;
  addLead: (lead: Omit<Lead, 'id'>) => Promise<void>;
  loadSampleData: () => Promise<void>;
  updateLeadNotes: (leadId: string, notes: string) => Promise<void>;
  updateLeadDealValue: (leadId: string, dealValue: number) => Promise<void>;
  updateLeadSnoozeDate: (leadId: string, snoozeUntil: string) => Promise<void>;
  userId: string | null;
  isAuthReady: boolean;
  login: () => void;
  logout: () => void;
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  templates: Template[];
  addTemplate: (template: Omit<Template, 'id' | 'createdAt'>) => Promise<void>;
  updateTemplate: (id: string, data: Partial<Omit<Template, 'id' | 'createdAt'>>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const LeadContext = createContext<LeadContextType | undefined>(undefined);

const defaultSettings: UserSettings = {
  autoScanEnabled: false,
  autoScanFrequencyHours: 24,
  lastScanTime: null,
  autoScanPrompt: 'Tech companies in California that recently announced series A funding',
  displayName: '',
  companyName: '',
  territory: '',
  specializations: [],
  emailSignature: '',
};

export function LeadProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setLeads([]);
      setSettings(defaultSettings);
      setTemplates([]);
      return;
    }

    const q = query(collection(db, 'leads'), where('userId', '==', userId));
    const unsubscribeLeads = onSnapshot(q, (snapshot) => {
      const fetchedLeads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      setLeads(fetchedLeads);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'leads');
    });

    const settingsRef = doc(db, 'userSettings', userId);
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...defaultSettings, ...docSnap.data() } as UserSettings);
      } else {
        setDoc(settingsRef, defaultSettings).catch(console.error);
      }
    });

    const q2 = query(collection(db, 'templates'), where('userId', '==', userId));
    const unsubscribeTemplates = onSnapshot(q2, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Template[];
      setTemplates(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'templates');
    });

    return () => {
      unsubscribeLeads();
      unsubscribeSettings();
      unsubscribeTemplates();
    };
  }, [isAuthReady, userId]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'userSettings', userId), newSettings);
    } catch (error) {
      console.error("Failed to update settings", error);
    }
  };

  const isScanningRef = useRef(false);

  useEffect(() => {
    if (!isAuthReady || !userId || !settings.autoScanEnabled || isScanningRef.current) return;

    const checkAndRunScan = async () => {
      const now = Date.now();
      const lastScan = settings.lastScanTime || 0;
      const hoursSinceLastScan = (now - lastScan) / (1000 * 60 * 60);

      if (hoursSinceLastScan >= settings.autoScanFrequencyHours) {
        isScanningRef.current = true;
        try {
          console.log("Running scheduled AI Lead Scan...");
          const newLeads = await scanForLeads(settings.autoScanPrompt);
          
          if (newLeads.length > 0) {
            const batch = writeBatch(db);
            newLeads.forEach(leadData => {
              const newLeadRef = doc(collection(db, 'leads'));
              batch.set(newLeadRef, { ...leadData, userId });
            });
            await batch.commit();
            console.log(`Successfully added ${newLeads.length} new leads from scheduled scan.`);
          }

          await updateSettings({ lastScanTime: now });
        } catch (error) {
          console.error("Scheduled scan failed:", error);
        } finally {
          isScanningRef.current = false;
        }
      }
    };

    checkAndRunScan();
  }, [settings, isAuthReady, userId]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addLead = async (leadData: Omit<Lead, 'id'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'leads'), { ...leadData, userId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leads');
    }
  };

  const loadSampleData = async () => {
    if (!userId) return;
    try {
      const batch = writeBatch(db);
      mockLeads.forEach(lead => {
        const newLeadRef = doc(collection(db, 'leads'));
        const { id, ...leadWithoutId } = lead;
        batch.set(newLeadRef, { ...leadWithoutId, userId });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'leads');
    }
  };

  const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'leads', leadId), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const addTask = async (leadId: string, task: Omit<Task, 'id'>) => {
    if (!userId) return;
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newTask = { ...task, id: Math.random().toString(36).substr(2, 9) };
    const updatedTasks = [...(lead.tasks || []), newTask];

    try {
      await updateDoc(doc(db, 'leads', leadId), { tasks: updatedTasks });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const toggleTask = async (leadId: string, taskId: string) => {
    if (!userId) return;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !lead.tasks) return;

    const updatedTasks = lead.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);

    try {
      await updateDoc(doc(db, 'leads', leadId), { tasks: updatedTasks });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const deleteLeads = async (leadIds: string[]) => {
    if (!userId) return;
    try {
      const batch = writeBatch(db);
      leadIds.forEach(id => {
        batch.delete(doc(db, 'leads', id));
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'leads');
    }
  };

  const updateLeadsStatus = async (leadIds: string[], status: Lead['status']) => {
    if (!userId) return;
    try {
      const batch = writeBatch(db);
      leadIds.forEach(id => {
        batch.update(doc(db, 'leads', id), { status });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'leads');
    }
  };

  const assignLeadsTerritory = async (leadIds: string[], territory: string) => {
    if (!userId) return;
    try {
      const batch = writeBatch(db);
      leadIds.forEach(id => {
        batch.update(doc(db, 'leads', id), { distributor_territory: territory });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'leads');
    }
  };

  const addTemplate = async (templateData: Omit<Template, 'id' | 'createdAt'>) => {
    if (!userId) return;
    try {
      await addDoc(collection(db, 'templates'), {
        ...templateData,
        userId,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'templates');
    }
  };

  const updateTemplate = async (id: string, data: Partial<Omit<Template, 'id' | 'createdAt'>>) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'templates', id), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `templates/${id}`);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `templates/${id}`);
    }
  };

  const updateLeadNotes = async (leadId: string, notes: string) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'leads', leadId), { notes });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const updateLeadDealValue = async (leadId: string, dealValue: number) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'leads', leadId), { deal_value: dealValue });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  const updateLeadSnoozeDate = async (leadId: string, snoozeUntil: string) => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'leads', leadId), { snooze_until: snoozeUntil });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  return (
    <LeadContext.Provider value={{
      leads, updateLeadStatus, addTask, toggleTask, deleteLeads, updateLeadsStatus, assignLeadsTerritory,
      addLead, loadSampleData,
      updateLeadNotes, updateLeadDealValue, updateLeadSnoozeDate,
      userId, isAuthReady, login, logout,
      settings, updateSettings,
      templates, addTemplate, updateTemplate, deleteTemplate,
    }}>
      {children}
    </LeadContext.Provider>
  );
}

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) throw new Error('useLeads must be used within LeadProvider');
  return context;
};
