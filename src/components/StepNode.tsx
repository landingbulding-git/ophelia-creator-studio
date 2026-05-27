import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { MousePointer2, Type, Eye, HelpCircle } from 'lucide-react';

const StepNode = ({ data, selected }: NodeProps) => {
  const step = data.step as any;
  const index = data.index as number;

  const getIcon = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'type': return <Type className="w-3.5 h-3.5" />;
      case 'hover': return <Eye className="w-3.5 h-3.5" />;
      default: return <MousePointer2 className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className={`
      relative group transition-all duration-200
      bg-[#1a1a1a] border rounded-xl overflow-hidden w-52
      ${selected ? 'border-ophelia-orange shadow-[0_0_15px_rgba(255,122,26,0.3)] scale-105' : 'border-white/10 hover:border-white/20'}
    `}>
      <Handle type="target" position={Position.Top} className="!bg-ophelia-orange !border-none !w-2 !h-2" />
      
      {/* Thumbnail */}
      <div className="aspect-video bg-black/40 relative overflow-hidden flex items-center justify-center border-b border-white/5">
        {step.screenshot ? (
          <img 
            src={step.screenshot} 
            alt={`Step ${index + 1}`}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" 
          />
        ) : (
          <HelpCircle className="w-6 h-6 text-white/10" />
        )}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
          STEP {index + 1}
        </div>
        <div className="absolute bottom-2 right-2 bg-ophelia-orange text-white p-1 rounded-md shadow-lg">
          {getIcon(step.action)}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
          {step.narration || 'No narration provided.'}
        </p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-ophelia-orange !border-none !w-2 !h-2" />
    </div>
  );
};

export default memo(StepNode);
