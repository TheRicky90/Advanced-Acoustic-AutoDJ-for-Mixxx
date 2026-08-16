🎧 Advanced Acoustic AutoDJ per Mixxx final version!

Un avanzato script di automazione in JavaScript per Mixxx DJ Software, re-ingegnerizzato per seguire le regole empiriche della potenza acustica e del harmonic mixing.
Questo script mappa un intero rack di EQ a 3 bande e un engine di 3 effetti direttamente sulla posizione del crossfader. La transizione è intelligente: scala dinamicamente tutti i parametri in tempo reale, permettendoti di controllare la durata e l'intensità del mix direttamente dall'interfaccia.


✨ Novità dell'aggiornamento (v2.2.0) 🚀

🆕 BPM Meeting Point Engine: Riscritta da zero la gestione del BPM tra le due tracce. Al momento del caricamento della traccia in coda (quando è ancora silenziosa, prima del fade), lo script calcola la media dei BPM reali rilevati da Mixxx (`file_bpm`) delle due tracce e porta **entrambi** i deck a quel valore intermedio in un unico passaggio pulito. Esempio: traccia A a 180 BPM, traccia B a 160 BPM → entrambe si assestano a 170 BPM prima ancora che il fade inizi.

🆕 Zero salti di tempo durante il fade: Il BPM non viene più toccato durante la transizione vera e propria. L'AutoDJ di Mixxx blocca le tracce nel proprio ciclo di sincronizzazione durante il fade, quindi qualsiasi tentativo di correggere il tempo in quella fase produceva salti udibili invece di un adattamento graduale. Ora tutta la matematica avviene una sola volta, in anticipo, quando la traccia è ancora muta.

🆕 Codebase più snello e stabile: Rimossi diversi meccanismi di sincronizzazione BPM sovrapposti e in conflitto tra loro (adattamento tramite `rate_temp`, glide multipli, `sync_mode`/`sync_enabled` istantanei) ereditati da versioni precedenti, che scrivevano il tempo delle tracce in contemporanea causando comportamento imprevedibile. Ora esiste un'unica logica, chiara e verificabile.

✨ Novità dell'aggiornamento (v2.1.0) 🚀


🆕 Sistema UV Boost Control: Gestione dinamica dei parametri EQ tramite controller esterno o skin dedicata ([UV_Control]). Puoi regolare l'intensità di Bass, Mid e High in tempo reale!

🆕 Genre Presets Intelligence: Supporto integrato per preset musicali (Electronic, Rock, Jazz, HipHop, Classical). L'algoritmo applica curve EQ ottimizzate specifiche per il genere caricato.

🆕 BPM-Responsive Mixing: L'aggressività del filtro e l'intensità dell'EQ non sono più statiche: si scalano automaticamente in base ai BPM della traccia. Più la traccia è veloce, più l'effetto è marcato e "punchy".

🆕 Bass Logic Avanzata: Nuovo algoritmo di passaggio dei bassi ("Aggressive Bass Swapping") che entra prima del centro fader e taglia nettamente la traccia in uscita per evitare l'effetto "fangoso" (muddy mix).


🌟 Caratteristiche Principali


Equal Power Acoustic Crossfade: L'attenuazione dell'EQ segue curve logaritmiche e trigonometriche (Math.cos / Math.sin), evitando bruschi cali di volume o impasti sonori.

Aggressive & Impactful Bass Swapping: Il basso della traccia in entrata si attiva precocemente (al 35% del passaggio), mentre il basso della traccia in uscita viene rimosso nettamente dopo il 50%, garantendo una cassa sempre definita.

Dynamic Reverb Proximity: La traccia in entrata parte immersa in un grande ambiente virtuale (55% Dry/Wet, 75% Room Size). Con l'avanzare del fader, la stanza si rimpicciolisce fino a zero, portando la traccia "più vicina" all'ascoltatore.

Time-Dilating Echo Outro: La traccia in uscita attiva una coda di echo dal 60% del mix. Il tempo dell'echo si dilata dinamicamente (da 1/8 a 1 beat completo) con un feedback crescente per un'uscita spaziosa e professionale.

Liquid Moog Filter Sweep: Entrambi i deck subiscono un filtro Passa-Basso speculare. Un "bump" di risonanza automatizzato raggiunge il picco esattamente al centro (50%) per simulare l'effetto di un mixer analogico high-end.

Total Automation Freedom: Tutti i parametri vengono azzerati e restituiti al controllo manuale dell'hardware nell'esatto millisecondo in cui termina la transizione.

BPM Meeting Point: All'inizio di ogni transizione, entrambe le tracce vengono portate al BPM medio reale (rilevato da Mixxx, non un valore fisso) tra uscente ed entrante, prima ancora che il fade sia udibile. Il tempo resta fermo per tutta la durata del mix: nessun salto, nessuna correzione a metà transizione.


🚀 Installazione e Configurazione (Windows)



Poiché Windows non supporta nativamente il routing MIDI virtuale, è necessario utilizzare un driver di loopback.

1. Installa un cavo MIDI virtuale
Scarica e installa loopMIDI (driver gratuito).
Apri loopMIDI e crea una nuova porta chiamata MixxxLoop.
Lascia loopMIDI attivo in background.
2. Copia lo script in Mixxx
Copia il file AutoDJ.js.
Incollalo nella cartella delle preferenze utente di Mixxx: C:\Users\<Tuo-Nome-Utente>\AppData\Local\Mixxx\controllers\
3. Attiva lo script in Mixxx
Apri Mixxx.
Vai su Opzioni > Preferenze > Controller.
Seleziona la porta virtuale (MixxxLoop).
Carica/abilita AutoDJ.js dalla scheda Mapping o Script e spunta la casella per attivarlo.


🎛️ Configurazione Obbligatoria del Rack Effetti



Per permettere allo script di controllare l'audio, è necessario configurare le unità FX di Mixxx esattamente così:

unita FX Slot 3 Rimane libero per un EQ 

FX Unit 1	Canale 1	Filtro Moog	Riverbero

FX Unit 2	Canale 2	Filtro Moog	Riverbero	

Quickslot   Canale 1-2  Filtro echo

<img width="2559" height="637" alt="Screenshot 2026-08-15 171837" src="https://github.com/user-attachments/assets/3d824ef4-68cd-4739-8d8c-94f2b8f65a6d" />


🎵 Come Usarlo



Carica le tracce nella coda/playlist dell'AutoDJ.

Imposta la durata del mix desiderata tramite lo slider nel pannello GUI di AutoDJ (es. 20s per transizioni rapide, 60s+ per generi progressivi). Puoi modificarlo durante il mix!
Assicurati di aver impostato un Hotcue 4 sulle tracce: funge da punto di trigger strutturale per l'uscita dell'automazione.
Clicca su Abilita AutoDJ.


📄 Licenza

Distribuito sotto licenza GNU GPL v3 o successiva.
