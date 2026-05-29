import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Video } from 'lucide-react';

const VideoNode = ({ data, selected }: NodeProps) => {
  const step = data.step as any;

  return (
    <div className={`
      relative group transition-all duration-200
      bg-[#1a1a1a] border rounded-xl overflow-hidden w-52
      ${selected ? 'border-ophelia-orange shadow-[0_0_15px_rgba(255,122,26,0.3)] scale-105' : 'border-white/10 hover:border-white/20'}
    `}>
      <Handle type="target" position={Position.Top} className="!bg-ophelia-orange !border-none !w-2 !h-2" />
      
      <div className="p-4 flex flex-col items-center gap-3 bg-black/20">
        <div className="w-10 h-10 rounded-full bg-ophelia-orange/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-ophelia-orange" />
        </div>
        <div className="text-center w-full truncate px-2">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Video Step</div>
            <div className="text-xs text-white leading-none tracking-tight truncate">
                {step.url || 'No URL set'}
            </div>
        </div>
      </div>

      <div className="p-3 border-t border-white/5 text-center">
        <p className="text-[10px] text-gray-400 italic leading-relaxed">
            Video plays on user's cursor.
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-ophelia-orange !border-none !w-2 !h-2" />
    </div>
  );
};

export default memo(VideoNode);
