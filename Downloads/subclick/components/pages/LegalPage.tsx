import React from 'react';
import PageLayout from './PageLayout';
import type { View } from '../../App';

interface LegalPageProps {
  onNavigate: (view: View) => void;
  page: 'privacy-policy' | 'terms-of-service' | 'cookie-policy' | 'acceptable-use' | 'patents';
}

const legalContent = {
    'privacy-policy': {
        title: <>Privacy <span className="font-serif italic">Policy</span></>,
        subtitle: 'Last updated: July 15, 2025',
        content: `
            <h2>1. Introduction</h2>
            <p>Welcome to SubClick ("we," "us," or "our"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it. This policy applies to all information collected through our website and services (the "Services").</p>
            
            <h2>2. Information We Collect</h2>
            <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and services, when you participate in activities on the Services, or otherwise when you contact us.</p>
            <p>The personal information that we collect depends on the context of your interactions with us and the Services, the choices you make, and the products and features you use. The personal information we collect may include the following:</p>
            <ul>
                <li><strong>Personal Information You Disclose to Us:</strong> We collect names; email addresses; job titles; contact preferences; billing addresses; debit/credit card numbers; and other similar information.</li>
                <li><strong>Information Automatically Collected:</strong> We automatically collect certain information when you visit, use, or navigate the Services. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Services, and other technical information.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use personal information collected via our Services for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.</p>
            <ul>
                <li>To facilitate account creation and logon process.</li>
                <li>To manage user accounts.</li>
                <li>To send administrative information to you.</li>
                <li>To fulfill and manage your orders, payments, returns, and exchanges.</li>
                <li>To post testimonials with your consent.</li>
                <li>To request feedback and to contact you about your use of our Services.</li>
                <li>To protect our Services from fraud monitoring and prevention.</li>
                <li>To enforce our terms, conditions and policies for business purposes, to comply with legal and regulatory requirements or in connection with our contract.</li>
            </ul>

            <h2>4. Will Your Information Be Shared With Anyone?</h2>
            <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. We may share your data with third-party vendors, service providers, contractors, or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include: payment processing, data analysis, email delivery, hosting services, and customer service.</p>
            
            <h2>5. Data Security</h2>
            <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>

            <h2>6. Your Privacy Rights</h2>
            <p>In some regions, such as the European Economic Area (EEA) and the United Kingdom (UK), you have rights that allow you greater access to and control over your personal information. You may review, change, or terminate your account at any time. You have the right to request access to the personal information we collect from you, change that information, or delete it in some circumstances.</p>

            <h2>7. Contact Us</h2>
            <p>If you have questions or comments about this policy, you may email us at privacy@subclick.com.</p>
        `
    },
    'terms-of-service': {
        title: <>Terms of <span className="font-serif italic">Service</span></>,
        subtitle: 'Effective Date: July 15, 2025',
        content: `
            <h2>1. Agreement to Terms</h2>
            <p>By accessing or using our services, you agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Services. These Terms constitute a legally binding agreement between you and SubClick.</p>
            
            <h2>2. Accounts</h2>
            <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.</p>
            
            <h2>3. Publisher Terms</h2>
            <p>If you are a Publisher, you grant SubClick the right to display advertisements on your integrated properties. You are responsible for properly integrating our SDK. Payments will be made on a monthly basis, subject to minimum earning thresholds and our payment policies. You agree not to engage in any fraudulent activities, including but not limited to generating fake impressions or clicks.</p>
            
            <h2>4. Advertiser Terms</h2>
            <p>If you are an Advertiser, you are responsible for the content of your advertisements and for all charges incurred for your campaigns. All ads are subject to our review and approval. We reserve the right to reject or remove any ad for any reason. Payments are due in accordance with the billing terms you agree to upon creating a campaign.</p>

            <h2>5. Intellectual Property</h2>
            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of SubClick and its licensors. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of SubClick.</p>

            <h2>6. Termination</h2>
            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.</p>

            <h2>7. Limitation of Liability</h2>
            <p>IN NO EVENT SHALL SUBCLICK, NOR ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES, BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.</p>

            <h2>8. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.</p>
        `
    },
    'cookie-policy': {
        title: <>Cookie <span className="font-serif italic">Policy</span></>,
        subtitle: 'Last updated: July 15, 2025',
        content: `
            <h2>1. What Are Cookies?</h2>
            <p>Cookies are small text files that are placed on your computer or mobile device by websites that you visit. They are widely used in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.</p>
            
            <h2>2. How We Use Cookies</h2>
            <p>We use cookies for several purposes. Some cookies are required for technical reasons in order for our Services to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Services. Third parties serve cookies through our Services for advertising, analytics, and other purposes.</p>
            <ul>
                <li><strong>Essential Website Cookies:</strong> These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas.</li>
                <li><strong>Performance and Functionality Cookies:</strong> These cookies are used to enhance the performance and functionality of our website but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.</li>
                <li><strong>Analytics and Customization Cookies:</strong> These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website for you.</li>
                <li><strong>Advertising Cookies:</strong> These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.</li>
            </ul>

            <h2>3. How Can I Control Cookies?</h2>
            <p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in your web browser. Most browsers allow you to refuse to accept cookies and to delete cookies. The methods for doing so vary from browser to browser, and from version to version.</p>
        `
    },
    'acceptable-use': {
        title: <>Acceptable <span className="font-serif italic">Use</span> Policy</>,
        subtitle: 'Last updated: July 15, 2025',
        content: `
            <h2>1. Introduction</h2>
            <p>This Acceptable Use Policy ("AUP") outlines the prohibited uses of the SubClick services. We may suspend or terminate your access to the Services if you engage in activities that violate this AUP.</p>

            <h2>2. Prohibited Content and Activities</h2>
            <p>You may not use the Services to display, store, process or transmit any of the following:</p>
            <ul>
                <li>Content that is illegal, fraudulent, or deceptive.</li>
                <li>Content that infringes on the intellectual property rights of others, including copyright, patents, trademarks, or trade secrets.</li>
                <li>Hate speech, discriminatory, or harassing content.</li>
                <li>Malware, viruses, or any other harmful computer code.</li>
                <li>Content that promotes or facilitates violence or illegal acts.</li>
            </ul>
            <p>You may not engage in any of the following activities:</p>
            <ul>
                <li>Attempting to gain unauthorized access to our systems or network.</li>
                <li>Engaging in any activity that interferes with or disrupts the Services (or the servers and networks which are connected to the Services).</li>
                <li>Using the Services for any form of fraudulent activity, including generating invalid impressions, clicks, or conversions through automated or deceptive means.</li>
                <li>Sending unsolicited communications, promotions, advertisements, or spam.</li>
            </ul>

            <h2>3. Enforcement</h2>
            <p>We reserve the right, but do not assume the obligation, to investigate any violation of this AUP or misuse of the Services. We may, in our sole discretion, remove any content or suspend or terminate your account for any violation of this AUP.</p>
        `
    },
    'patents': {
        title: <><span className="font-serif italic">Intellectual</span> Property Notice</>,
        subtitle: 'SubClick Innovation',
        content: `
            <h2>Patent-Pending Technologies</h2>
            <p>SubClick is built on a foundation of innovation. Our company has developed and applied for patents on several proprietary technologies that are core to our platform. This includes, but is not limited to:</p>
            <ul>
                <li>Our system and method for displaying an ephemeral "ghost" advertisement within a generative AI input field.</li>
                <li>Our method for dual-stage transparent sponsorship disclosure in an AI interface.</li>
                <li>Our computer-implemented method for ad auctioning based on generative AI technical context, including semantic matching.</li>
            </ul>
            <p>These innovations represent our commitment to building a new, ethical, and effective advertising model for the AI era. The "patent pending" status indicates that one or more patent applications have been filed with the relevant authorities, and we are dedicated to protecting our intellectual property rights.</p>
            
            <h2>Trademarks</h2>
            <p>The "SubClick" name, the SubClick logo, and any other product or service names, logos or slogans contained in the Services are trademarks of SubClick and its suppliers or licensors, and may not be copied, imitated or used, in whole or in part, without the prior written permission of SubClick or the applicable trademark holder.</p>
            
            <h2>Contact</h2>
            <p>For any inquiries regarding our intellectual property, please contact our legal department at legal@subclick.com.</p>
        `
    }
};

const LegalPage: React.FC<LegalPageProps> = ({ onNavigate, page }) => {
  const { title, subtitle, content } = legalContent[page];

  return (
    <PageLayout
      onNavigate={onNavigate}
      title={title}
      subtitle={subtitle}
    >
      <div 
        className="prose prose-lg max-w-4xl mx-auto"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </PageLayout>
  );
};

export default LegalPage;
