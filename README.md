🎧 Advanced Acoustic AutoDJ v2.1.0 for Mixxx

Re-engineered JavaScript Automation Engine

Empirical Acoustic Power Rules | Harmonic Mixing Principles | Real-Time Parameter Scaling

🚀 Overview
L'Advanced Acoustic AutoDJ non è un semplice script di automazione, ma un motore di transizione intelligente progettato per Mixxx. A differenza dei classici crossfader, questo sistema mappa dinamicamente un intero rack EQ a 3 bande e un motore di effetti (Moog Filter, Reverb, Echo) sulla posizione del crossfader.

Ogni parametro viene scalato in tempo reale seguendo curve trigonometriche e logaritmiche, garantendo che la transizione mantenga sempre l'integrità armonica e la potenza acustica, evitando il tipico effetto "fangoso" (muddy mix) delle automazioni standard.

✨ What's New in v2.1.0 🚀
🔮 UV Boost Control System
Gestione dinamica dei parametri EQ tramite controller esterno o skin dedicata ([UV_Control]).

Live Reading Architecture: Nessun caching; il sistema legge il valore del bass boost direttamente dal motore Mixxx nell'esatto istante in cui serve durante la transizione.
Three-Band Control: Gestione indipendente di Bass, Mid e High (range 1.0–4.0).
Genre Presets Intelligence: Supporto integrato per preset musicali ottimizzati (Electronic, Rock, Jazz, HipHop, Classical).
🎵 BPM-Responsive Mixing Engine
L'aggressività del filtro e l'intensità dell'EQ non sono più statiche: si scalano automaticamente in base al BPM della traccia.

Copy
javascript
// Logica di scaling interna: Più la traccia è veloce, più l'effetto è "punchy"
var currentIntensity = Math.min(2.0, Math.max(0.5, (nextBpm - 80) / 80 + 0.5));
Adaptive Filter Response: La profondità del Moog filter sweep aumenta proporzionalmente al tempo.
Smart Echo Timing: Il decadimento dell'echo si dilata automaticamente per le tracce più veloci, garantendo un'uscita spaziosa e professionale.
🎚️ Aggressive & Impactful Bass Swapping
Nuovo algoritmo di gestione delle frequenze basse re-ingegnerizzato:

Early Entry: Il basso della traccia in entrata si attiva precocemente (al 35% del passaggio).
Sharp Exit Cut: Il basso della traccia in uscita viene rimosso nettamente dopo il 50%, garantendo una cassa sempre definita e mai sovrapposta.
🌟 Core Features & Mathematical Logic
Feature	Description	Mathematical Model
Equal Power Crossfade	Attenuazione EQ che segue curve sinusoidali.	Math.cos / Math.sin (Evita cali di volume)
Liquid Moog Filter	Filtro Passa-Basso speculare sui due deck.	Resonance "bump" al centro (50%) per effetto analogico
Dynamic Reverb Proximity	La traccia in entrata parte con un ambiente ampio che si restringe verso il centro.	Room Size: 75% → 0% (Effetto avvicinamento)
Time-Dilating Echo Outro	Coda di echo intelligente per l'uscita della traccia.	Echo Time: 1/8 beat → 1 full beat (Decadimento dinamico)
🎛️ Required Effects Rack Configuration
Per permettere allo script di controllare l'audio, è obbligatorio configurare le unità FX di Mixxx esattamente come segue:

FX Unit	Canale Assegnato	Slot 1 (Effect1)	Slot 2 (Effect2)	Slot 3 (Effect3)
FX Unit 1	Canale 1	Moog Filter	Reverb	Echo
FX Unit 2	Canale 2	Moog Filter	Reverb	Echo
[!IMPORTANT]
Assicurati che l'interruttore principale (Power) di tutti e 3 gli slot sia impostato su ON nell'interfaccia prima di avviare l'AutoDJ.

🚀 Installation & Configuration (Windows)
Step 1: Install Virtual MIDI Driver
Poiché Windows non supporta nativamente il routing MIDI virtuale, è necessario un driver di loopback.

Scarica e installa loopMIDI (gratuito).
Apri loopMIDI e crea una nuova porta chiamata MixxxLoop.
Lascia loopMIDI attivo in background.
Step 2: Deploy Script to Mixxx
Copia il file AutoDJ.js nella cartella delle preferenze di Mixxx:
C:\Users\<Tuo-Nome-Utente>\AppData\Local\Mixxx\controllers\
Step 3: Activate in Mixxx Preferences
Apri Mixxx 
→
→ Opzioni 
→
→ Preferenze 
→
→ Controller.
Seleziona la porta virtuale MixxxLoop.
Carica/Abilita AutoDJ.js dalla scheda Mapping o Script.
Spunta la casella per attivarlo.
🎵 Usage Guide
Pre-Setup Checklist
 Hotcue 4: Imposta un Hotcue 4 su tutte le tracce (funge da trigger strutturale per l'uscita dell'automazione).
 Playlist Order: Configura la coda delle tracce.
 Mix Duration: Imposta la durata desiderata tramite lo slider GUI (es. 20s per transizioni rapide, 60s+ per generi progressivi).
Operation Flow
Abilita AutoDJ tramite MIDI trigger o pulsante GUI.
Lo script auto-configura Mixxx (Quantize, Keylock, Crossfader).
Il sistema monitora i play_indicator per rilevare la transizione.
Durante il mix: L'algoritmo calcola l'intensità BPM e applica le curve EQ/Filter in tempo reale.
Al trigger Hotcue 4: Viene attivato il fade_now strutturale per un'uscita pulita.
📊 UV Parameter API Reference (Developer Mode)
Funzioni JavaScript esposte al motore Mixxx per monitoraggio esterno o calibrazione manuale.

Function	Description	Default Range
readLiveBassBoost()	Lettura live dal motore (no cache).	2.0 (se errore)
getUVParameters()	Esporta valori attuali {bassMax, midMax, highMax}.	Object
setUVParameters(b, m, h)	Override manuale con validazione.	Clamped safe range
applyUVGenrePreset(genre)	Applica preset musicali istantaneamente.	electronic, rock, etc.
Recommended Presets:

Copy
javascript
{
  electronic: { bass: 2.8, mid: 1.6, high: 1.4 },
  rock:       { bass: 2.2, mid: 1.9, high: 1.2 },
  jazz:       { bass: 1.8, mid: 2.0, high: 1.1 },
  hipHop:     { bass: 3.0, mid: 1.5, high: 1.3 },
  classical:  { bass: 1.6, mid: 2.1, high: 1.0 }
}
🐛 Troubleshooting
Issue	Likely Cause	Solution
Bass remains muddy	UV parametri non letti	Verifica che il widget [UV_Control] esista nella skin.
Effects not activating	Rack FX mal configurato	Controlla che tutti i Power switch siano ON.
Script unresponsive	Porta MIDI non selezionata	Re-seleziona MixxxLoop in Preferences.
EQ values clamping	Valori fuori range (1.0-4.0)	Usa setUVParameters() con input validati.
📄 License
Distribuito sotto licenza GNU GPL v3 o successiva.

Version 2.1.0 — Dynamic Parameter Management with Genre Presets
