
    import React, { useState, useCallback, useMemo, useEffect } from 'react';
    import ReactGA from 'react-ga4';
    import RideInputForm from './components/RideInputForm';
    import RideAnalysisCard from './components/RideAnalysisCard';
    import SettingsModal from './components/SettingsModal';
    import SettingsIcon from './components/icons/SettingsIcon';
    import ThemeToggle from './components/ThemeToggle';
    import type { RideInput, RideAnalysis, Settings } from './types';
    import { Profitability } from './types';

    // Substitua pelo seu ID de Métrica do Google Analytics
    const GA_MEASUREMENT_ID = "G-XXXXXXXXXX"; 

    const App: React.FC = () => {
      // Inicializa o Google Analytics uma vez
      useEffect(() => {
        if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
            ReactGA.initialize(GA_MEASUREMENT_ID);
            // Opcional: Envia um evento de visualização de página quando o app carrega
            ReactGA.send({ hitType: "pageview", page: window.location.pathname });
        }
      }, []);
      
      const [rides, setRides] = useState<RideAnalysis[]>(() => {
        try {
            const savedRides = localStorage.getItem('appRides');
            return savedRides ? JSON.parse(savedRides) : [];
        } catch (e) {
            return [];
        }
      });

      const [settings, setSettings] = useState<Settings>(() => {
        try {
            const savedSettings = localStorage.getItem('appSettings');
            return savedSettings ? JSON.parse(savedSettings) : {
              targetEarningsPerKm: 2.0,
              gasPrice: 5.80,
              fuelConsumption: 12, // km/L
              otherVehicleCostsPerKm: 0.30,
              currency: 'R$',
            };
        } catch (e) {
            return {
              targetEarningsPerKm: 2.0,
              gasPrice: 5.80,
              fuelConsumption: 12, // km/L
              otherVehicleCostsPerKm: 0.30,
              currency: 'R$',
            };
        }
      });

      const [isSettingsOpen, setIsSettingsOpen] = useState(false);
      
      const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = localStorage.getItem('appTheme');
        if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          return 'dark';
        }
        return 'light';
      });

      useEffect(() => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('appTheme', theme);
      }, [theme]);
      
      useEffect(() => {
        localStorage.setItem('appSettings', JSON.stringify(settings));
      }, [settings]);

      useEffect(() => {
        localStorage.setItem('appRides', JSON.stringify(rides));
      }, [rides]);

      const analyzeRide = useCallback((ride: RideInput, currentSettings: Settings): RideAnalysis => {
        const totalTimeHours = ride.estimatedTime / 60;
        
        const fuelCostPerKm = currentSettings.fuelConsumption > 0 ? currentSettings.gasPrice / currentSettings.fuelConsumption : 0;
        const totalVehicleCostPerKm = fuelCostPerKm + currentSettings.otherVehicleCostsPerKm;
        
        const totalCost = ride.distanceOfTrip * totalVehicleCostPerKm;
        const netProfit = ride.fare - totalCost;
        
        const netEarningsPerKm = ride.distanceOfTrip > 0 ? netProfit / ride.distanceOfTrip : 0;
        const netEarningsPerHour = totalTimeHours > 0 ? netProfit / totalTimeHours : 0;
        const grossEarningsPerHour = totalTimeHours > 0 ? ride.fare / totalTimeHours : 0;

        let profitability: Profitability;
        if (netEarningsPerKm >= currentSettings.targetEarningsPerKm) {
          profitability = Profitability.GOOD;
        } else if (netEarningsPerKm >= currentSettings.targetEarningsPerKm * 0.7) {
          profitability = Profitability.MEDIUM;
        } else {
          profitability = Profitability.BAD;
        }

        return {
          ...ride,
          id: new Date().toISOString() + Math.random(),
          totalTimeHours,
          netProfit,
          netEarningsPerKm,
          netEarningsPerHour,
          grossEarningsPerHour,
          profitability,
        };
      }, []);

      const handleAddRide = (ride: RideInput) => {
        const newAnalyzedRide = analyzeRide(ride, settings);
        setRides(prevRides => [newAnalyzedRide, ...prevRides]);

        // Rastreia o evento de análise de corrida
        ReactGA.event({
            category: 'Ride',
            action: 'Analyzed_Ride',
            label: `Profitability: ${newAnalyzedRide.profitability}`
        });
      };
      
      const handleDeleteRide = (id: string) => {
        setRides(prevRides => prevRides.filter(ride => ride.id !== id));
      };
      
      const handleSaveSettings = (newSettings: Settings) => {
        setSettings(newSettings);
        setRides(prevRides => prevRides.map(ride => analyzeRide(ride, newSettings)));
      };

      const sortedRides = useMemo(() => {
        return [...rides].sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
      }, [rides]);

      return (
        <div className="min-h-screen font-sans">
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
               <div className="flex items-center">
                 <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary tracking-tight">
                   Tá Valendo!
                 </h1>
               </div>
               <div className="flex items-center gap-2">
                <ThemeToggle theme={theme} setTheme={setTheme} />
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Open settings"
                >
                  <SettingsIcon className="text-slate-600 dark:text-slate-300" />
                </button>
              </div>
            </div>
          </header>

          <main className="container mx-auto p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                 <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Adicionar Análise</h2>
                 <RideInputForm onAddRide={handleAddRide} settings={settings} />
              </div>

              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">Análises de Corridas</h2>
                {sortedRides.length > 0 ? (
                    <div className="space-y-4">
                      {sortedRides.map((ride) => (
                        <RideAnalysisCard 
                            key={ride.id} 
                            ride={ride} 
                            settings={settings} 
                            onDelete={handleDeleteRide}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-6 bg-white dark:bg-slate-800 rounded-2xl">
                       <span className="text-4xl">📊</span>
                      <p className="text-slate-500 dark:text-slate-400 mt-4">Nenhuma corrida analisada ainda.</p>
                      <p className="text-slate-400 dark:text-slate-500 mt-1 text-sm">Preencha o formulário para começar.</p>
                    </div>
                  )
                }
              </div>
            </div>
          </main>
          
          <footer className="text-center py-6 text-slate-500 dark:text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Tá Valendo!. Decida a melhor corrida.</p>
          </footer>

          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)} 
            settings={settings}
            onSave={handleSaveSettings}
          />
        </div>
      );
    };

    export default App;
    