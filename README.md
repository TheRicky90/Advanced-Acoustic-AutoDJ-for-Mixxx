Certamente. Ho analizzato il codice `AutoDj.js` e ho notato l'integrazione di un sistema avanzatissimo per la gestione dei parametri EQ tramite controllori esterni (UV Boost Parameter Management System).

Ho riscritto il file README, creando una sezione dedicata a questa nuova funzionalità e aggiornando i dettagli tecnici per riflettere appieno la potenza del sistema.

***

# 🎧 Advanced Acoustic AutoDJ per Mixxx (Aggiornato v2.1)

Un algoritmo di automazione avanzato in JavaScript per **Mixxx DJ Software** (basato sul codice originale di *Byron Xu*), completamente ri-ingegnerizzato per seguire le regole empiriche della potenza acustica, del *harmonic mixing* e del controllo dinamico dei parametri EQ.

A differenza dei classici sfumati lineari di volume, questo script mappa un intero rack di **EQ a 3 bande** e un **engine di 3 effetti** direttamente sulla posizione del crossfader della GUI di Mixxx. Scala dinamicamente tutti i parametri in tempo reale, permettendoti non solo di modificare la transizione al volo, ma anche di *potenziare* acusticamente il mix con controlli esterni dedicati.

---

## ✨ Caratteristiche Principali (Aggiornato)

*   **Equal Power Acoustic Crossfade:** L'attenuazione del volume dell'EQ a 3 bande segue curve logaritmiche e trigonometriche, garantendo un passaggio armonico fluido che evita cali di volume o impastamenti sonori.
*   **Sistema UV Boost Dinamico (NUOVO):** Integrazione completa con controllori esterni per il controllo dinamico dei parametri EQ (Bass, Mid, High). È possibile impostare boost massimi specifici e caricare preset predefiniti basati sul genere musicale (es. HipHop, Rock) direttamente nello script.
*   **Aggressive & Impactful Bass Swapping:** Il basso della traccia in entrata si attiva presto (al **35%** del passaggio del crossfader), mentre il basso della traccia in uscita subisce un taglio netto dopo il **50%**, garantendo che la nuova cassa sia nitida e potente.
*   **Dynamic Reverb Proximity:** La traccia in entrata parte immersa in un grande ambiente virtuale (Dry/Wet, Room Size). Con l'avanzare del fader, lo spazio si rimpicciolisce fino a zero, portando la traccia "più vicina" all'ascoltatore.
*   **Time-Dilating Echo Outro:** La traccia in uscita attiva una ricca coda di echo a partire dal **60%**. Il tempo di eco si dilata dinamicamente da un 1/8 di beat ritmico fino a 1/1 di beat completo, con un feedback crescente (fino al **75%**) per un'uscita d'impatto e spaziosa.
*   **Liquid Moog Filter Sweep:** Entrambi i deck subiscono un filtro Passa-Basso speculare. Un "bump" di risonanza automatizzato raggiunge il picco esattamente al centro (**50%**) per colorare la transizione come su un mixer analogico professionale.
*   **Total Automation Freedom:** Tutti i parametri degli effetti e le manopole dell'EQ vengono azzerati e restituiti al controllo manuale nell'esatto millisecondo in cui termina la transizione, garantendo il massimo controllo all'utente.

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

## 🎛️ Configurazione Obbligatoria del Rack Effetti & Boost EQ

Per consentire allo script di interagire con l'engine audio senza generare errori in console, **è necessario** configurare le unità FX e i controlli MIDI esattamente come segue:

### A. Unità Effetti (FX)
| Unità FX | Assegnazione Canale | Slot 1 (Effect1) | Slot 2 (Effect2) | Slot 3 (Effect3) |
| :--- | :--- | :--- | :--- | :--- |
| **FX Unit 1** | Canale 1 (*Tasto 1 ON, Tasto 2 OFF*) | **Filtro Moog** | **Riverbero** | **Eco** |
| **FX Unit 2** | Canale 2 (*Tasto 2 ON, Tasto 1 OFF*) | **Filtro Moog** | **Riverbero** | **Eco** |

> ⚠️ **Importante:** Assicurati che l'interruttore principale di alimentazione per tutti e 3 gli slot su entrambe le unità FX sia impostato su **ON** nell'interfaccia prima di avviare l'AutoDJ.

### B. Controlli Boost EQ (UV Controller)
I parametri di boost sono mappati sui seguenti controlli MIDI CC:

| Funzione | Controllo MIDI CC | Descrizione |
| :--- | :--- | :--- |
| **Bass Max** | `CC 140` | Regola il massimo potenziamento delle basse frequenze. |
| **Mid Max** | `CC 141` | Regola il massimo potenziamento delle medie frequenze. |
| **High Max** | `CC 142` | Regola il massimo potenziamento delle alte frequenze. |

---

## 🎵 Come Usare l'AutoDJ con Boost Dinamico

1. **Carica le tracce** nella coda/playlist dell'AutoDJ all'interno di Mixxx.
2. **Configura i parametri EQ:** Utilizza i controllori esterni (o la GUI) per impostare i livelli massimi di boost desiderati tramite i canali MIDI CC 140-142.
3. **Imposta il Genere (Opzionale):** Se stai utilizzando un pannello di controllo che emula le funzioni API, puoi caricare preset specifici (es. `hipHop` o `rock`) per ottimizzare automaticamente i parametri Boost in base al genere musicale.
4. **Avvia l'Automazione:** Clicca su **Abilita AutoDJ**.

L'algoritmo calcolerà i punti d'ingresso, allineerà le fasi del BPM e muoverà EQs ed effetti in modo fluido e adattivo, utilizzando i parametri di boost che hai impostato per un impatto sonoro massimo.

---

## 📄 Licenza

Questo progetto è distribuito sotto licenza **GNU GPL v3 o successiva**. Sentiti libero di fare un *fork*, modificare i parametri o aprire *issues* e *pull request* su GitHub!
