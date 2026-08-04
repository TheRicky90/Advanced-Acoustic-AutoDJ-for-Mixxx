function midiAutoDJ() {}

/*
    AutoDJ for Mixxx
    Byron Xu, 2018
    Licensed under the GNU GPL v3 or later

    ---
    MODIFICHE INTEGRATE:
    - Logica TEMPORALE TOTALMENTE DINAMICA: EQ ed effetti seguono la durata impostata nella GUI di Mixxx.
    - Cambiamenti della durata della transizione applicati al volo durante il mix.
    - Curva cosinusoidale ultra-dolce applicata a tutte le dissolvenze per passaggi melodici.
*/

// BASIC OPTIONS
midiAutoDJ.exitCue = 4;             // Hotcue di uscita (Default: 4)
midiAutoDJ.preStart = 64;           // Durata sovrapposizione in battute (Default: 64)
midiAutoDJ.useEQ = 1;               // Abilita controllo EQ (Default: 1)
midiAutoDJ.useMidHighEQ = 1;        // Controlla anche Medi e Alti (Default: 1)

// Soglie relative del Crossfader (0.0 a 1.0) per l'attivazione asimmetrica
midiAutoDJ.eqEntryMidHighThreshold = 0.25;
midiAutoDJ.eqEntryBassThreshold = 0.45;
midiAutoDJ.eqExitBassThreshold = 0.15;
midiAutoDJ.eqExitMidHighThreshold = 0.35;

// Opzioni Effetti Integrati
midiAutoDJ.useFilterFX = 1;         // Abilita la gestione dei 3 Effetti Avanzati
midiAutoDJ.filterFxIntensity = 0.85; // Intensità massima smussata per il Filtro Moog
midiAutoDJ.filterFxInvert = 0;      

midiAutoDJ.maxBpmAdjustment = 6;    // Massimo stretching BPM consentito (6%)
midiAutoDJ.transpose = 1;           // Abilita mix armonico con trasposizione chiave
midiAutoDJ.transposeMax = 1;        // Massimo semitoni di trasposizione (1)

// ADVANCED OPTIONS
midiAutoDJ.bpmSync = 1;
midiAutoDJ.bpmSyncFade = 1;
midiAutoDJ.transposeSkipsMax = 3;
midiAutoDJ.fadeQuickEffect = 0;
midiAutoDJ.reverseQuickEffect = 0;
midiAutoDJ.fadeRange = 0.5;
midiAutoDJ.refineDuration = 1000;
midiAutoDJ.sleepDuration = 250;

// Global Variables
midiAutoDJ.sleepTimer = 0;
midiAutoDJ.connected = 0;
midiAutoDJ.syncing = 0;
midiAutoDJ.skips = 0;
midiAutoDJ.transposeSkips = 0;
midiAutoDJ.refineWait = 0;
midiAutoDJ.songLoaded = 0;

midiAutoDJ.init = function(id) {
    id = 0;
    engine.setValue("[Channel1]", "quantize", 1.0);
    engine.setValue("[Channel2]", "quantize", 1.0);
    engine.setValue("[Channel1]", "keylock", 1.0);
    engine.setValue("[Channel2]", "keylock", 1.0);
    engine.setValue("[Channel1]", "keylockMode", 0.0);
    engine.setValue("[Channel2]", "keylockMode", 0.0);
    engine.setValue("[Master]", "crossfader", -1.0);

    if (engine.connectControl("[AutoDJ]", "enabled", "midiAutoDJ.toggle")) {
        midiAutoDJ.connected = 1;
        engine.trigger("[AutoDJ]", "enabled");
    } else {
        midiAutoDJ.sleepTimer = engine.beginTimer(midiAutoDJ.sleepDuration, "midiAutoDJ.main()");
    }
};

midiAutoDJ.shutdown = function(id) {
    id = 0;
    if (midiAutoDJ.connected && engine.connectControl("[AutoDJ]", "enabled", "midiAutoDJ.toggle", true)) {
        midiAutoDJ.connected = 0;
    }
    if (midiAutoDJ.sleepTimer) {
        engine.stopTimer(midiAutoDJ.sleepTimer);
    }
};

midiAutoDJ.toggle = function(value, group, control) {
    group = 0; control = 0;
    if (value) {
        midiAutoDJ.songLoaded = 0;
        midiAutoDJ.sleepTimer = engine.beginTimer(midiAutoDJ.sleepDuration, "midiAutoDJ.main()");
    } else if (midiAutoDJ.sleepTimer) {
        engine.stopTimer(midiAutoDJ.sleepTimer);
        midiAutoDJ.sleepTimer = 0;
    }
};
midiAutoDJ.main = function() {
    var deck1Playing = engine.getValue("[Channel1]", "play_indicator");
    var deck2Playing = engine.getValue("[Channel2]", "play_indicator");
    var prev = 1;
    var next = 2;
    var prevPos = engine.getValue("[Channel"+prev+"]", "playposition");
    var nextPos = engine.getValue("[Channel"+next+"]", "playposition");
    if ( prevPos === -1 || nextPos === -1 ) { return; }

    if (deck1Playing && ! deck2Playing) {
        prev = 1; next = 2;
    } else if (deck2Playing && ! deck1Playing) {
        prev = 2; next = 1;
        var tmp = nextPos; nextPos = prevPos; prevPos = tmp;
    } else {
        if (prevPos < nextPos) {
            var tmp = nextPos; nextPos = prevPos; prevPos = tmp;
            next = 1; prev = 2;
        }
    }

    var nextPlaying = engine.getValue("[Channel"+next+"]", "play_indicator");
    var prevBpm = engine.getValue("[Channel"+prev+"]", "file_bpm");
    var nextBpm = engine.getValue("[Channel"+next+"]", "file_bpm");

    var diffBpm = 100 * Math.abs(nextBpm - prevBpm) / nextBpm;
    var diffBpmDouble = 0;
    if (nextBpm < prevBpm) {
        diffBpmDouble = 100 * Math.abs(nextBpm - prevBpm*0.5) / nextBpm;
    } else {
        diffBpmDouble = 100 * Math.abs(nextBpm - prevBpm*2) / nextBpm;
    }

    // Lettura della posizione reale del crossfader grafico di Mixxx
    var crossfader = engine.getValue("[Master]", "crossfader");
    crossfader = (crossfader+1.0)/2.0; 
    if ( next === 1 ) {
        crossfader = 1.0-crossfader;
    }

    // TRANSIZIONE ATTIVA IN CORSO
    if (nextPlaying && nextPos > -0.15) {
        skip = 0;
        midiAutoDJ.songLoaded = 0;

        // VALORI EQ CALCOLATI ESCLUSIVAMENTE SULLA POSIZIONE DEL CROSSFADER (DURATA VARIABILE)
        if (midiAutoDJ.useEQ) {
            // Canale in ENTRATA (next) - Curva sinusoidale pura basata sul fader
            if (midiAutoDJ.useMidHighEQ) {
                if (crossfader > midiAutoDJ.eqEntryMidHighThreshold) {
                    var factorMH = (crossfader - midiAutoDJ.eqEntryMidHighThreshold) / (1.0 - midiAutoDJ.eqEntryMidHighThreshold);
                    var nextMidHighVal = 0.2 + (0.8 * Math.sin(factorMH * Math.PI / 2));
                    engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter2", Math.min(1.0, nextMidHighVal));
                    engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter3", Math.min(1.0, nextMidHighVal));
                } else {
                    engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter2", 0.2);
                    engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter3", 0.2);
                }
            }
            if (crossfader > midiAutoDJ.eqEntryBassThreshold) {
                var factorB = (crossfader - midiAutoDJ.eqEntryBassThreshold) / (1.0 - midiAutoDJ.eqEntryBassThreshold);
                var nextBassVal = 0.2 + (0.8 * Math.sin(factorB * Math.PI / 2));
                engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter1", Math.min(1.0, nextBassVal));
            } else {
                engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter1", 0.2);
            }

            // Canale in USCITA (prev) - Curva cosinusoidale basata sul fader
            if (crossfader < midiAutoDJ.eqExitBassThreshold) {
                engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter1", 1.0);
            } else {
                var factorOutB = (crossfader - midiAutoDJ.eqExitBassThreshold) / (1.0 - midiAutoDJ.eqExitBassThreshold);
                var prevBassVal = Math.cos(factorOutB * Math.PI / 2);
                engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter1", Math.max(0.0, prevBassVal));
            }

            if (midiAutoDJ.useMidHighEQ) {
                if (crossfader < midiAutoDJ.eqExitMidHighThreshold) {
                    engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter2", 1.0);
                    engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter3", 1.0);
                } else {
                    var factorOutMH = (crossfader - midiAutoDJ.eqExitMidHighThreshold) / (1.0 - midiAutoDJ.eqExitMidHighThreshold);
                    var prevMidHighVal = Math.cos(factorOutMH * Math.PI / 2);
                    engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter2", Math.max(0.0, prevMidHighVal));
                    engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter3", Math.max(0.0, prevMidHighVal));
                }
            }
        }
        // LOGICA EFFETTI ANCORATI AL CROSSFADER GRAFICO (DURATA TEMPORALE ADATTIVA)
        if (midiAutoDJ.useFilterFX) {
            var fxFloor = 1.0 - midiAutoDJ.filterFxIntensity;

            // SLOT 1: Filtro Moog (Sganciato dai cicli interni, segue la posizione visiva del fader)
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "enabled", 1.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "enabled", 1.0);

            var filterCurvePrev = Math.cos(crossfader * Math.PI / 2);
            var prevFxValue = 1.0 - ((1.0 - filterCurvePrev) * midiAutoDJ.filterFxIntensity);
            engine.setValue("[EffectRack1_EffectUnit"+prev+"_Effect1]", "parameter1", midiAutoDJ.filterFxInvert ? (1.0 - prevFxValue) : prevFxValue);

            var filterCurveNext = Math.sin(crossfader * Math.PI / 2);
            var nextFxValue = fxFloor + (filterCurveNext * midiAutoDJ.filterFxIntensity);
            engine.setValue("[EffectRack1_EffectUnit"+next+"_Effect1]", "parameter1", midiAutoDJ.filterFxInvert ? (1.0 - nextFxValue) : nextFxValue);

            // SLOT 2: Riverbero (Segue la velocità della transizione visiva estendendosi fino al 90% del fader)
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "enabled", 1.0);
            if (crossfader < 0.90) {
                var reverbVal = 0.45 * Math.cos((crossfader / 0.90) * Math.PI / 2);
                engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "drywet", reverbVal);
            } else {
                engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "drywet", 0.0);
                engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "enabled", 0.0);
            }

            // SLOT 3: Echo (Segue la velocità della transizione visiva, attivo dal 60% al 100% del fader)
            if (crossfader > 0.60) {
                engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect3]", "enabled", 1.0);
                var echoFactor = (crossfader - 0.60) / 0.40;
                var echoVal = 0.90 * Math.sin(echoFactor * Math.PI / 2);
                engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect3]", "drywet", echoVal);
            } else {
                engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect3]", "drywet", 0.0);
                engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect3]", "enabled", 0.0);
            }
        }

        // LOGICA SYNC BPM (Invariata)
        if ( midiAutoDJ.bpmSync ) {
            if ( ! midiAutoDJ.syncing ) {
                if (midiAutoDJ.bpmSyncFade) {
                    midiAutoDJ.syncing = 1;
                    engine.setValue("[Channel"+next+"]", "sync_mode", 1.0);
                    engine.setValue("[Channel"+prev+"]", "sync_mode", 2.0);
                    engine.setValue("[Channel"+next+"]", "sync_enabled", 1.0);
                    engine.setValue("[Channel"+next+"]", "sync_enabled", 0.0);
                } else if (engine.getValue("[Channel"+prev+"]", "beat_active")) {
                    midiAutoDJ.syncing = 1;
                    engine.setValue("[Channel"+prev+"]", "sync_mode", 1.0);
                    engine.setValue("[Channel"+next+"]", "sync_mode", 2.0);
                    engine.setValue("[Channel"+prev+"]", "sync_enabled", 1.0);
                    engine.setValue("[Channel"+prev+"]", "sync_enabled", 0.0);
                }
            }
        }

    } else { 
        // TRACCIA SOLITARIA / FINE TRANSIZIONE (Disattivazione e Pulizia Controlli)
        if (midiAutoDJ.useEQ) {
            engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter1", 1.0);
            if (midiAutoDJ.useMidHighEQ) {
                engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter2", 1.0);
                engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter3", 1.0);
            }
        }
        if (midiAutoDJ.useFilterFX) {
            // Reset totale di sicurezza di tutti e 3 gli Slot su entrambe le unità (Rilascio controlli fisici)
            var fxOpenValue = midiAutoDJ.filterFxInvert ? 0.0 : 1.0;
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "parameter1", fxOpenValue);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "enabled", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "drywet", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "enabled", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect3]", "drywet", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect3]", "enabled", 0.0);
            
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "parameter1", fxOpenValue);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "enabled", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "drywet", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "enabled", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect3]", "drywet", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect3]", "enabled", 0.0);
        }

        if (midiAutoDJ.bpmSyncFade) {
            engine.setValue("[Channel"+prev+"]", "bpm", prevBpm);
        }

        if ( midiAutoDJ.syncing ) {
            midiAutoDJ.syncing = 0;
            engine.setValue("[Channel"+prev+"]", "sync_mode", 0.0);
            engine.setValue("[Channel"+next+next+"]", "sync_mode", 0.0);
        }

        if ( midiAutoDJ.fadeQuickEffect ) {
            engine.setValue("[QuickEffectRack1_[Channel"+next+"]]", "super1", 0.5+midiAutoDJ.fadeRange/2.0);
            engine.setValue("[QuickEffectRack1_[Channel"+prev+"]]", "super1", 0.5);
        }

        // Calcolo Punto di Uscita Hotcue 4
        var exitCueSamples = engine.getValue("[Channel"+prev+"]", "hotcue_"+midiAutoDJ.exitCue+"_position");
        if (exitCueSamples != -1) {
            var currentPos = engine.getValue("[Channel"+prev+"]", "playposition");
            var sampleRate = engine.getValue("[Channel"+prev+"]", "track_samplerate");
            var trackDuration = engine.getValue("[Channel"+prev+"]", "duration");
            var exitCuePos = exitCueSamples / sampleRate / trackDuration / 2;

            var prevBpmCurrent = engine.getValue("[Channel"+prev+"]", "bpm");
            var nextBpmCurrent = engine.getValue("[Channel"+next+"]", "bpm");
            var exitCueOffset = midiAutoDJ.preStart * 60.0 / prevBpmCurrent / trackDuration;

            if (nextBpmCurrent > prevBpmCurrent + 1) { exitCueOffset = exitCueOffset * 0.5; }
            if (nextBpmCurrent + 1 < prevBpmCurrent) { exitCueOffset = exitCueOffset * 2; }

            if (currentPos >= exitCuePos - exitCueOffset - 0.0008) {
                engine.setValue("[AutoDJ]", "fade_now", 1.0);
                engine.setValue("[AutoDJ]", "fade_now", 0.0);
            }
        }

        // PREPARAZIONE E RE-SET DELLA TRACCIA IN PRE-START
        var skip = 0;
        if ( diffBpm > midiAutoDJ.maxBpmAdjustment && diffBpmDouble > midiAutoDJ.maxBpmAdjustment ) { skip = 1; }

        if (midiAutoDJ.transpose && !skip) {
            var oldKey = engine.getValue("[Channel"+next+"]", "key");
            engine.setValue("[Channel"+next+"]", "sync_key", 1.0);
            engine.setValue("[Channel"+next+"]", "sync_key", 0.0);
            var newKey = engine.getValue("[Channel"+next+"]", "key");

            if (Math.abs(newKey - oldKey) > midiAutoDJ.transposeMax + 0.001) {
                if (midiAutoDJ.transposeSkips < midiAutoDJ.transposeSkipsMax) {
                    skip = 1; midiAutoDJ.transposeSkips++;
                } else {
                    engine.setValue("[Channel"+next+"]", "key", oldKey);
                }
            }
        }

        if (skip) {
            skip = 0; midiAutoDJ.songLoaded = 0;
            engine.setValue("[AutoDJ]", "skip_next", 1.0);
            engine.setValue("[AutoDJ]", "skip_next", 0.0);
            midiAutoDJ.skips++;
        } else {
            skip = 0; midiAutoDJ.transposeSkips = 0;

            if (! midiAutoDJ.songLoaded) {
                midiAutoDJ.songLoaded = 1;
                engine.setValue("[Channel"+next+"]", "cue_gotoandstop", 1.0);
                engine.setValue("[Channel"+next+"]", "cue_gotoandstop", 0.0);

                var cueSamples = engine.getValue("[Channel"+next+"]", "cue_point");
                var nextSampleRate = engine.getValue("[Channel"+next+"]", "track_samplerate");
                var cueTimeSec = (nextSampleRate > 0) ? (cueSamples / nextSampleRate / 2) : 0;
                var availableBeats = (nextBpm > 0) ? (cueTimeSec * nextBpm / 60) : 0;
                var effectivePreStart = Math.min(midiAutoDJ.preStart, Math.max(0, Math.floor(availableBeats)));

                if (effectivePreStart > 0) {
                    engine.setValue("[Channel"+next+"]", "beatjump_size", effectivePreStart);
                    engine.setValue("[Channel"+next+"]", "beatjump_backward", 1.0);
                    engine.setValue("[Channel"+next+"]", "beatjump_backward", 0.0);
                }

                // INIZIALIZZAZIONE ARMONICA DOLCE PRIMA DEL MOVIMENTO
                if (midiAutoDJ.useEQ) {
                    engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter1", 1.0);
                    if (midiAutoDJ.useMidHighEQ) {
                        engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter2", 1.0);
                        engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter3", 1.0);
                    }
                    engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter1", 0.2);
                    if (midiAutoDJ.useMidHighEQ) {
                        engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter2", 0.2);
                        engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter3", 0.2);
                    }
                }

                if (midiAutoDJ.useFilterFX) {
                    var fxFloorStart = 1.0 - midiAutoDJ.filterFxIntensity;
                    
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "enabled", 1.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "parameter1", midiAutoDJ.filterFxInvert ? 0.0 : 1.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "enabled", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "drywet", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect3]", "enabled", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect3]", "drywet", 0.0);

                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "enabled", 1.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "parameter1", midiAutoDJ.filterFxInvert ? (1.0 - fxFloorStart) : fxFloorStart);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "enabled", 1.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "drywet", 0.45); // Riverbero d'ambiente iniziale morbido (45%)
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect3]", "enabled", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect3]", "drywet", 0.0);
                }

                var nextBpmAdjusted = nextBpm;
                if (midiAutoDJ.bpmSyncFade) {
                    nextBpmAdjusted = prevBpm;
                    if ( diffBpmDouble < diffBpm ) {
                        if ( nextBpm < prevBpm ) { nextBpmAdjusted = prevBpm/2; } else { nextBpmAdjusted = prevBpm*2; }
                    }
                }
                engine.setValue("[Channel"+next+"]", "bpm", nextBpmAdjusted);
            }
        }
    }
};
