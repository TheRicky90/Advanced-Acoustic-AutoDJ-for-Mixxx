# 🎧 Advanced Acoustic AutoDJ per Mixxx

Un uno script di automazione avanzato in JavaScript per **Mixxx DJ Software** (originalmente basato sul codice di *Byron Xu*), re-ingegnerizzato per seguire le regole empiriche della potenza acustica e del *harmonic mixing*.

A differenza dei classici sfumati lineari di volume, questo script mappa un intero rack di **EQ a 3 bande** e un **engine di 3 effetti** direttamente sulla posizione del crossfader della GUI di Mixxx. Scala dinamicamente tutti i parametri in tempo reale, permettendoti di modificare la durata della transizione al volo direttamente dall'interfaccia.

---

## ✨ Caratteristiche Principali

*   **Equal Power Acoustic Crossfade:** L'attenuazione del volume dell'EQ a 3 bande segue curve logaritmiche e trigonometriche (Math.cos / Math.sin), evitando bruschi cali di volume o impastamenti sonori.
*   **Aggressive & Impactful Bass Swapping:** Il basso della traccia in entrata si attiva presto (al **35%** del passaggio del crossfader), mentre il basso della traccia in uscita subisce un taglio netto dopo il **50%** per far passare la nuova cassa in modo nitido e potente.
*   **Dynamic Reverb Proximity:** La traccia in entrata parte immersa in un grande ambiente virtuale (**55% Dry/Wet**, **75% Room Size**). Con l'avanzare del fader, la stanza si rimpicciolisce fino a 0, portando la traccia "più vicina" all'ascoltatore.
*   **Time-Dilating Echo Outro:** La traccia in uscita attiva una ricca coda di echo a partire dal **60%** del mix. Il tempo di echo si dilata dinamicamente da un 1/8 di beat ritmico fino a 1/1 di beat completo, con un feedback crescente (fino al **75%**) per un'uscita d'impatto e spaziosa.
*   **Liquid Moog Filter Sweep:** Entrambi i deck subiscono un filtro Passa-Basso speculare. Un "bump" di risonanza automatizzato raggiunge il picco esattamente al centro (**50%**) per colorare la transizione come su un mixer analogico di alta gamma.
*   **Total Automation Freedom:** Tutti i parametri degli effetti e le manopole dell'EQ vengono azzerati e restituiti al controllo manuale dell'hardware nell'esatto millisecondo in cui termina la transizione.

---

## 🚀 Installazione e Configurazione (Windows)

Poiché Windows non supporta nativamente il routing MIDI virtuale, è necessario utilizzare un driver di *loopback* per inviare lo script a Mixxx come se fosse un "controller virtuale".

### 1. Installa un cavo MIDI virtuale
1. Scarica e installa **loopMIDI** (driver gratuito e leggero per Windows).
2. Apri **loopMIDI** e clicca sul pulsante `+` nell'angolo in basso a sinistra per creare una nuova porta virtuale.
3. Rinomina la porta in **`MixxxLoop`**.
4. Lascia loopMIDI attivo in background.

### 2. Copia lo script in Mixxx
1. Copia il file compilato **`AutoDJ.js`**.
2. Incollalo nella cartella delle preferenze utente di Mixxx:
   ```text
   C:\Users\<Tuo-Nome-Utente>\AppData\Local\Mixxx\controllers\
   ```
   *(Nota: `AppData` è una cartella nascosta di default).*

### 3. Attiva lo script in Mixxx
1. Apri Mixxx.
2. Vai su **Opzioni > Preferenze > Controller**.
3. Seleziona la porta virtuale (**MixxxLoop**) dall'elenco dei dispositivi.
4. Apri la scheda avanzata **Mapping** o **Script**, carica/abilita `AutoDJ.js` e spunta la casella per attivarlo.

---

## 🎛️ Configurazione Obbligatoria del Rack Effetti

Per consentire allo script di interagire con l'engine audio senza generare errori in console, **è necessario** configurare le unità FX di Mixxx esattamente come segue:

| Unità FX | Assegnazione Canale | Slot 1 (Effect1) | Slot 2 (Effect2) | Slot 3 (Effect3) |
| :--- | :--- | :--- | :--- | :--- |
| **FX Unit 1** | Canale 1 (*Tasto 1 ON, Tasto 2 OFF*) | **Filtro Moog** | **Riverbero** | **Eco** |
| **FX Unit 2** | Canale 2 (*Tasto 2 ON, Tasto 1 OFF*) | **Filtro Moog** | **Riverbero** | **Eco** |

> ⚠️ **Importante:** Assicurati che l'interruttore principale di alimentazione per tutti e 3 gli slot su entrambe le unità FX sia impostato su **ON** nell'interfaccia prima di avviare l'AutoDJ.

---

## 🎵 Come Usarlo

1. **Carica le tracce** nella coda/playlist dell'AutoDJ all'interno di Mixxx.
2. **Imposta la durata del mix** desiderata direttamente dal pannello GUI di AutoDJ in Mixxx (es. *20 secondi* per mix rapidi, *60+ secondi* per generi progressive). *Puoi modificare questo slider in qualsiasi momento durante la riproduzione!*
3. Assicurati di aver impostato un **Hotcue 4** sulle tue tracce. Questo cue funge da punto di trigger strutturale per l'uscita dell'automazione.
4. Clicca su **Abilita AutoDJ**.

L'algoritmo calcolerà i punti d'ingresso, allineerà le fasi del BPM, bloccherà la griglia e muoverà EQs ed effetti in modo fluido e adattivo!

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza **GNU GPL v3 o successiva**. Sentiti libero di fare un *fork*, modificare i parametri o aprire *issues* e *pull request* su GitHub!
