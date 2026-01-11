"use client";

import { useState } from "react";
import { deleteGroupAction } from "@/app/actions"; 
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

interface Props {
  groupId: string;
  groupName: string;
}

export function DeleteGroupZone({ groupId, groupName }: Props) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // The phrase they must type. 
  // We sanitize it to make it easy to type (lowercase).
  const CONFIRM_PHRASE = `delete ${groupName.toLowerCase().substring(0, 15)}`; 

  async function handleDelete() {
    if (input !== CONFIRM_PHRASE) return;
    
    const confirmFinal = window.confirm("Are you absolutely sure? This cannot be undone.");
    if (!confirmFinal) return;

    setIsLoading(true);
    try {
      await deleteGroupAction(groupId);
    } catch (error) {
      alert("Failed to delete group. Ensure all members are removed first if your database requires it.");
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-12 border border-red-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-red-50/50 p-4 border-b border-red-100 flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-full">
           <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h3 className="font-bold text-red-900">Danger Zone</h3>
          <p className="text-xs text-red-700">Irreversible actions</p>
        </div>
      </div>
      
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-2">Delete this group</h4>
        <p className="text-sm text-gray-500 mb-6 max-w-2xl">
          This action cannot be undone. This will permanently delete the group 
          <strong> {groupName}</strong>, remove all member associations, and delete all chat history.
        </p>

        <div className="max-w-md space-y-3">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
            Type <span className="text-red-600 select-all bg-red-50 px-1 py-0.5 rounded border border-red-100 font-mono text-sm">{CONFIRM_PHRASE}</span> to confirm
          </label>
          
          <div className="flex gap-3">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
            />
            <button
              onClick={handleDelete}
              disabled={input !== CONFIRM_PHRASE || isLoading}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all
                ${input === CONFIRM_PHRASE 
                  ? "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg" 
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"}
              `}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}