import React from 'react';
import { Download, FileVideo, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAppContext } from '../context/AppContext';

export default function DownloadsView() {
  const { state } = useAppContext();

  const handleRedownload = (filePath: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = filePath;
    a.download = fileName;
    a.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Downloads</h1>
        <p className="text-gray-400">Your exported video files. Files are kept for 7 days.</p>
      </div>

      {state.downloads.length === 0 ? (
        <div className="bg-[#111113] border border-white/10 rounded-xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <Download className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">No downloads yet</h2>
          <p className="text-gray-500 text-sm">Approve a variant and export it to see it here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {state.downloads.map(dl => (
            <div
              key={dl.id}
              className="flex items-center gap-4 bg-[#111113] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                <FileVideo className="w-6 h-6 text-indigo-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{dl.fileName}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(dl.downloadedAt), 'MMM d, yyyy h:mm a')}
                  {dl.fileSize > 0 && (
                    <span className="ml-2 text-gray-600">
                      · {(dl.fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => handleRedownload(dl.filePath, dl.fileName)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
