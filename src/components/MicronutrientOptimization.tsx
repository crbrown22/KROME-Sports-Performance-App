import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Search, Info, Droplets, Sun, Zap, Shield, Brain, Bone, Activity, Pill, Clock } from "lucide-react";
import { micronutrients } from "../data/micronutrientData";
import { supplements } from "../data/supplementData";

interface Props {
  key?: string;
  onBack: () => void;
}

export default function MicronutrientOptimization({ onBack }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"micronutrients" | "supplements">("micronutrients");
  const [selectedSolubility, setSelectedSolubility] = useState<"All" | "Fat-soluble" | "Water-soluble">("All");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const filteredMicronutrients = micronutrients.filter(nutrient => {
    const nameStr = nutrient.name || '';
    const benefitsStr = nutrient.benefits || '';
    const sourcesStr = nutrient.sources || '';
    const matchesSearch = nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      benefitsStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sourcesStr.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSolubility = selectedSolubility === "All" || nutrient.solubility === selectedSolubility;
    return matchesSearch && matchesSolubility;
  });

  const filteredSupplements = supplements.filter(supplement => {
    const nameStr = supplement.name || '';
    const benefitsStr = supplement.benefits || '';
    const descStr = supplement.description || '';
    return nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      benefitsStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descStr.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => a.ranking - b.ranking);

  const getIcon = (name: string) => {
    if (name.includes("Vitamin D") || name.includes("Vitamin K")) return <Bone className="w-6 h-6" />;
    if (name.includes("Vitamin C") || name.includes("Vitamin A") || name.includes("Vitamin E")) return <Shield className="w-6 h-6" />;
    if (name.includes("B12") || name.includes("B6") || name.includes("B9")) return <Brain className="w-6 h-6" />;
    return <Zap className="w-6 h-6" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black text-white pt-24 pb-12 overflow-x-hidden"
    >
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2000&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-20 grayscale mix-blend-overlay"
          alt="Micronutrient Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-blue-900/10" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gold font-bold uppercase text-xs tracking-widest mb-8 hover:gap-4 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Nutrition
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-12 items-end">
          <div>
            <h2 className="text-gold font-bold uppercase tracking-[0.2em] text-sm mb-2">Module 02</h2>
            <h1 className="text-4xl md:text-6xl font-black uppercase italic leading-none tracking-tighter">
              Micronutrient & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-accent pr-2 pb-2">Supplementation Optimization</span>
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search & Filter */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/80 border border-white/5 rounded-3xl p-6">
              
              {/* Tabs */}
              <div className="flex p-1 bg-black/40 rounded-xl mb-6 border border-white/5">
                <button
                  onClick={() => { setActiveTab("micronutrients"); setSelectedItem(null); }}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === "micronutrients" ? "bg-gold text-black shadow-lg" : "text-white/40 hover:text-white"
                  }`}
                >
                  Micronutrients
                </button>
                <button
                  onClick={() => { setActiveTab("supplements"); setSelectedItem(null); }}
                  className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === "supplements" ? "bg-gold text-black shadow-lg" : "text-white/40 hover:text-white"
                  }`}
                >
                  Supplements
                </button>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input 
                    type="text" 
                    placeholder={activeTab === "micronutrients" ? "Search vitamins..." : "Search supplements..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-all"
                  />
                </div>
                
                {activeTab === "micronutrients" && (
                  <div className="flex gap-2">
                    {(["All", "Fat-soluble", "Water-soluble"] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedSolubility(type)}
                        className={`px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex-1 ${
                          selectedSolubility === type 
                            ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {type === "All" ? "All Types" : type}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                {activeTab === "micronutrients" ? (
                  filteredMicronutrients.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-white/30 italic">
                      No micronutrients found matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredMicronutrients.map((nutrient) => (
                      <motion.div 
                        key={nutrient.id}
                        layoutId={nutrient.id}
                        onClick={() => setSelectedItem(nutrient.id)}
                        className={`relative p-6 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${
                          selectedItem === nutrient.id 
                            ? 'bg-white/10 border-gold/50 shadow-xl shadow-gold/10' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black/40 ${nutrient.color}`}>
                            {getIcon(nutrient.name)}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            nutrient.solubility === 'Fat-soluble' 
                              ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                            {nutrient.solubility === 'Fat-soluble' ? (
                              <span className="flex items-center gap-1"><Sun className="w-3 h-3" /> Fat Soluble</span>
                            ) : (
                              <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> Water Soluble</span>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-black uppercase italic mb-2 group-hover:text-gold transition-colors">{nutrient.name}</h3>
                        <p className="text-xs text-white/60 line-clamp-2 mb-4">{nutrient.description}</p>
                        
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                          <Activity className="w-3 h-3" />
                          <span>{nutrient.dosage}</span>
                        </div>
                      </motion.div>
                    ))
                  )
                ) : (
                  filteredSupplements.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-white/30 italic">
                      No supplements found matching "{searchQuery}"
                    </div>
                  ) : (
                    filteredSupplements.map((supplement) => (
                      <motion.div 
                        key={supplement.id}
                        layoutId={supplement.id}
                        onClick={() => setSelectedItem(supplement.id)}
                        className={`relative p-6 rounded-2xl border transition-all cursor-pointer group overflow-hidden ${
                          selectedItem === supplement.id 
                            ? 'bg-white/10 border-gold/50 shadow-xl shadow-gold/10' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/40 text-purple-400">
                            <Pill className="w-6 h-6" />
                          </div>
                          <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                            Rank #{supplement.ranking}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-black uppercase italic mb-2 group-hover:text-gold transition-colors">{supplement.name}</h3>
                        <p className="text-xs text-white/60 line-clamp-2 mb-4">{supplement.description}</p>
                        
                        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
                          <Clock className="w-3 h-3" />
                          <span>{supplement.timing}</span>
                        </div>
                      </motion.div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedItem ? (
                (() => {
                  if (activeTab === "micronutrients") {
                    const nutrient = micronutrients.find(n => n.id === selectedItem)!;
                    return (
                      <motion.div 
                        key={nutrient.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-zinc-900/80 border border-white/5 rounded-3xl p-8 h-full sticky top-24"
                      >
                        <div className="flex items-center gap-4 mb-8">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-black/40 ${nutrient.color}`}>
                            {getIcon(nutrient.name)}
                          </div>
                          <div>
                            <h2 className="text-2xl font-black uppercase italic leading-none">{nutrient.name}</h2>
                            <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${nutrient.color}`}>{nutrient.solubility}</p>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 flex items-center gap-2">
                              <Activity className="w-3 h-3" /> Performance Impact
                            </h4>
                            <p className="text-lg font-medium leading-relaxed text-white/90">
                              {nutrient.performanceTip}
                            </p>
                          </div>

                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Primary Benefits</h4>
                            <p className="text-sm text-white/70">{nutrient.benefits}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Dosage (M)</h4>
                              <p className="text-sm font-mono text-gold">{nutrient.dosage.split(',')[0]}</p>
                            </div>
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Dosage (F)</h4>
                              <p className="text-sm font-mono text-gold">{nutrient.dosage.split(',')[1] || nutrient.dosage}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Best Food Sources</h4>
                            <div className="flex flex-wrap gap-2">
                              {nutrient.sources.split(', ').map((source, i) => (
                                <span key={i} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium hover:bg-white/20 transition-colors cursor-default">
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  } else {
                    const supplement = supplements.find(s => s.id === selectedItem)!;
                    return (
                      <motion.div 
                        key={supplement.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="bg-zinc-900/80 border border-white/5 rounded-3xl p-8 h-full sticky top-24"
                      >
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-black/40 text-purple-400">
                            <Pill className="w-8 h-8" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-black uppercase italic leading-none">{supplement.name}</h2>
                            <p className="text-xs font-bold uppercase tracking-widest mt-1 text-purple-400">Rank #{supplement.ranking}</p>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 flex items-center gap-2">
                              <Activity className="w-3 h-3" /> Primary Benefits
                            </h4>
                            <p className="text-lg font-medium leading-relaxed text-white/90">
                              {supplement.benefits}
                            </p>
                          </div>

                          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">Description</h4>
                            <p className="text-sm text-white/70">{supplement.description}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Dosage</h4>
                              <p className="text-sm font-mono text-gold">{supplement.dosage}</p>
                            </div>
                            <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Timing</h4>
                              <p className="text-sm font-mono text-gold">{supplement.timing}</p>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-3">Recommended Brands</h4>
                            <div className="flex flex-wrap gap-2">
                              {supplement.sources.split(', ').map((source, i) => (
                                <span key={i} className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-medium hover:bg-white/20 transition-colors cursor-default">
                                  {source}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }
                })()
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center space-y-4"
                >
                  <Info className="w-16 h-16 text-white/10" />
                  <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Select an item to view details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
