import React, { useState, useEffect, useCallback } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import StepNode from './StepNode';
import { 
  ChevronLeft, 
  X, 
  Info, 
  MousePointer2, 
  Type, 
  Trash2,
  ExternalLink,
  Layers,
  CheckCircle2
} from 'lucide-react';

const nodeTypes = {
  step: StepNode,
};

interface EditorProps {
  guideId: string;
}

export default function LiveEditor() {
  const [guide, setGuide] = useState<any>({ name: 'Live Recording Session' });
  const [loading, setLoading] = useState(true);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [generatingVars, setGeneratingVars] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Allow messages from the extension side panel
      if (!event.data || event.data.action !== 'SYNC_LIVE_STEPS') return;
      
      const steps = event.data.steps || [];
      
      // Create Nodes
      const initialNodes: Node[] = steps.map((step: any, i: number) => ({
        id: `step-${i}`,
        type: 'step',
        position: { x: 50, y: i * 250 + 50 },
        data: { step, index: i },
      }));

      // Create Edges
      const initialEdges: Edge[] = [];
      for (let i = 0; i < steps.length - 1; i++) {
        initialEdges.push({
          id: `edge-${i}`,
          source: `step-${i}`,
          target: `step-${i + 1}`,
          animated: true,
          style: { stroke: '#ff7a1a', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ff7a1a' },
        });
      }

      setNodes(initialNodes);
      setEdges(initialEdges);
      setLoading(false);
    };

    window.addEventListener('message', handleMessage);
    
    // Notify parent that we are ready to receive steps
    window.parent.postMessage({ action: 'LIVE_EDITOR_READY' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, [setNodes, setEdges]);

  // Sync changes back to the extension
  const syncToExtension = (newNodes: Node[]) => {
    const updatedSteps = newNodes
      .sort((a, b) => a.position.y - b.position.y)
      .map(node => (node.data.step as any));
    window.parent.postMessage({ action: 'UPDATE_LIVE_STEPS', steps: updatedSteps }, '*');
  };

  const onNodeClick = (_: any, node: Node) => {
    setSelectedNode(node);
  };

  const handleUpdateNarration = (newNarration: string) => {
    if (!selectedNode) return;
    
    setNodes((nds) => {
      const newNodes = nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              step: { ...(node.data.step as any), narration: newNarration },
            },
          };
        }
        return node;
      });
      syncToExtension(newNodes);
      return newNodes;
    });
    
    // Also update locally selected node for UI sync
    setSelectedNode({
        ...selectedNode,
        data: {
            ...selectedNode.data,
            step: { ...(selectedNode.data.step as any), narration: newNarration }
        }
    });
  };

  const handleUpdatePrompt = (newPrompt: string) => {
    if (!selectedNode) return;
    
    setNodes((nds) => {
      const newNodes = nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              step: { ...(node.data.step as any), prompt: newPrompt },
            },
          };
        }
        return node;
      });
      syncToExtension(newNodes);
      return newNodes;
    });
    
    setSelectedNode({
        ...selectedNode,
        data: {
            ...selectedNode.data,
            step: { ...(selectedNode.data.step as any), prompt: newPrompt }
        }
    });
  };

  const handleParseVariables = async () => {
    const activeStep = selectedNode?.data.step as any;
    if (!selectedNode || !activeStep.prompt) return;
    
    const matches = Array.from(activeStep.prompt.matchAll(/<([^>]+)>/g));
    const vars = matches.map(m => m[1]);
    
    if (vars.length === 0) {
        alert("No variables found. Use <variable_name> syntax.");
        return;
    }
    
    setGeneratingVars(true);
    try {
        // Without auth token for simplicity in live mode, or fallback to prompt
        // Wait, auth token might not be available in live mode if they aren't logged in to Studio directly.
        // But sidepanel has cookies! However, we removed user auth context for simplicity?
        // Ah, `const { user } = useAuth();` is still there in the import. I need to keep it or just skip the auth token if not available.
        alert('Parsing variables during live recording is not yet supported. Please do this in the Studio later.');
    } catch (err) {
        console.error(err);
    } finally {
        setGeneratingVars(false);
    }
  };

  const handleSave = () => {
      window.parent.postMessage({ action: 'FINISH_RECORDING' }, '*');
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ophelia-orange"></div>
    </div>
  );

  const getScreenshotSrc = (src: string) => {
    if (!src) return '';
    if (src.startsWith('data:')) return src;
    return `data:image/jpeg;base64,${src}`;
  };

  const activeStep = selectedNode?.data.step as any;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]">
      {/* Top Bar */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0a0a0a]/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-4">
          <a href="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </a>
          <h1 className="font-bold text-lg truncate max-w-[200px] sm:max-w-md">
            {guide?.name}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.open(guide?.pageUrl, '_blank')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Original Page
          </button>
          <button 
            onClick={handleSave}
            className="bg-ophelia-orange hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            Finish
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-[#0c0c0c]"
          >
            <Background color="#222" gap={20} />
            <Controls className="!bg-[#1a1a1a] !border-white/10 !fill-white" />
            <Panel position="top-right" className="bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 p-3 rounded-xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Canvas Instructions</p>
                <p className="text-xs text-gray-300 italic text-center">Click a node to edit details.</p>
            </Panel>
          </ReactFlow>
        </div>

        {/* Inspector Panel */}
        <div className={`
          w-[400px] border-l border-white/5 bg-[#0f0f0f] flex flex-col transition-all duration-300
          ${selectedNode ? 'translate-x-0' : 'translate-x-full fixed right-0 h-full'}
        `}>
          {selectedNode ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                  <Info className="w-4 h-4 text-ophelia-orange" />
                  Step Details
                </h2>
                <button onClick={() => setSelectedNode(null)} className="p-2 hover:bg-white/5 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Screenshot Section */}
                <section>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">UI Capture</label>
                  <div className="rounded-2xl border border-white/10 overflow-hidden bg-black aspect-video relative group">
                    {activeStep.screenshot ? (
                      <img src={getScreenshotSrc(activeStep.screenshot)} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 italic text-sm">No screenshot captured</div>
                    )}
                  </div>
                </section>

                {/* Narration Editor */}
                <section>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">AI Narration</label>
                  <textarea 
                    value={activeStep.narration}
                    onChange={(e) => handleUpdateNarration(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm leading-relaxed focus:border-ophelia-orange/50 outline-none h-32 resize-none transition-colors"
                    placeholder="What should Ophelia say here?"
                  />
                  <p className="text-[10px] text-gray-600 mt-2 italic">Speak for the ear, not the eye. Keep it warm and direct.</p>
                </section>

                {/* Technical Fingerprint */}
                <section>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">Interaction</label>
                  <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-ophelia-orange/10 flex items-center justify-center">
                        {activeStep.action === 'type' ? <Type className="w-4 h-4 text-ophelia-orange" /> : <MousePointer2 className="w-4 h-4 text-ophelia-orange" />}
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">{activeStep.action || 'Click'}</div>
                        <div className="text-xs font-mono text-gray-300">target: {activeStep.fingerprint?.tag || 'unknown'}</div>
                      </div>
                    </div>
                    
                    {activeStep.fingerprint?.aria_label && (
                      <div className="text-[11px] text-gray-500 bg-black/40 p-2 rounded-md border border-white/5">
                        <span className="text-gray-600">aria-label:</span> {activeStep.fingerprint.aria_label}
                      </div>
                    )}
                  </div>
                </section>

                {/* AI Prompt Extension */}
                {activeStep.action === 'type' && (
                  <section className="animate-in fade-in slide-in-from-top-2 duration-300">
                    {activeStep.variables && Object.keys(activeStep.variables).length > 0 && (
                      <div className="mb-4 space-y-3">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Generated Questions</label>
                        <div className="space-y-2">
                          {Object.entries(activeStep.variables).map(([key, question]: [string, any]) => (
                            <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-3">
                              <div className="text-[9px] text-ophelia-orange font-bold uppercase mb-1">{key}</div>
                              <div className="text-xs text-gray-300 leading-relaxed">{question}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">AI Prompt / Auto-Paste</label>
                        <button 
                          onClick={handleParseVariables}
                          disabled={generatingVars}
                          className="p-1 hover:bg-white/10 rounded text-green-500 disabled:opacity-50 transition-colors flex items-center justify-center"
                          title="Parse variables and generate questions"
                        >
                          {generatingVars ? <div className="animate-spin h-3 w-3 border-b-2 border-green-500 rounded-full" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold border border-blue-500/20">NEW</div>
                    </div>
                    <textarea 
                      value={activeStep.prompt || ''}
                      onChange={(e) => handleUpdatePrompt(e.target.value)}
                      className="w-full bg-blue-500/[0.03] border border-blue-500/20 rounded-xl p-4 text-sm leading-relaxed focus:border-blue-500/50 outline-none h-24 resize-none transition-colors text-blue-100"
                      placeholder="Paste text or use <variable> syntax..."
                    />
                    <p className="text-[10px] text-gray-600 mt-2 italic">If set, Ophelia will automatically paste this text into the field during playback.</p>
                  </section>
                )}
              </div>

              <div className="p-6 border-t border-white/5 bg-black/20">
                <button 
                    className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    onClick={() => {
                        if(confirm('Delete this step?')) {
                            setNodes(nds => {
                                const newNodes = nds.filter(n => n.id !== selectedNode.id);
                                syncToExtension(newNodes);
                                return newNodes;
                            });
                            setSelectedNode(null);
                        }
                    }}
                >
                    <Trash2 className="w-4 h-4" />
                    Remove Step
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-600">
               <Layers className="w-12 h-12 mb-4 opacity-20" />
               <p className="text-sm italic">Select a node on the canvas to inspect and edit its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
