function midiAutoDJ() {}
midiAutoDJ.exitCue = 4;
midiAutoDJ.preStart = 64;
midiAutoDJ.useEQ = 1;
midiAutoDJ.useMidHighEQ = 1;
midiAutoDJ.useFilterFX = 1;
midiAutoDJ.filterFxIntensity = 0.85;
midiAutoDJ.filterFxInvert = 0;
midiAutoDJ.echoEnabledInSolo = 1;
midiAutoDJ.echoIntensitySolo = 0.35;
midiAutoDJ.maxBpmAdjustment = 20;
midiAutoDJ.transpose = 1;
midiAutoDJ.transposeMax = 1;
midiAutoDJ.bpmSync = 1;
midiAutoDJ.bpmSyncFade = 1;
midiAutoDJ.transposeSkipsMax = 3;
midiAutoDJ.fadeQuickEffect = 0;
midiAutoDJ.reverseQuickEffect = 0;
midiAutoDJ.fadeRange = 0.5;
midiAutoDJ.refineDuration = 1000;
midiAutoDJ.sleepDuration = 250;
midiAutoDJ.bpmAdaptationEnabled = 1;
midiAutoDJ.sleepTimer = 0;
midiAutoDJ.connected = 0;
midiAutoDJ.syncing = 0;
midiAutoDJ.skips = 0;
midiAutoDJ.transposeSkips = 0;
midiAutoDJ.refineWait = 0;
midiAutoDJ.songLoaded = 0;
midiAutoDJ.thresholds = { bassIn: 0.35, bassOut: 0.45, highIn: 0.25, highOut: 0.55, echoStart: 0.45, reverbEnd: 0.90, peakBass: 0.60 };

midiAutoDJ.init = function(id) {
    id = 0;
    
    engine.setValue("[Channel1]", "quantize", 1.0);
    engine.setValue("[Channel2]", "quantize", 1.0);
    engine.setValue("[Channel1]", "keylock", 1.0);
    engine.setValue("[Channel2]", "keylock", 1.0);
    engine.setValue("[Channel1]", "keylockMode", 0.0);
    engine.setValue("[Channel2]", "keylockMode", 0.0);
    engine.setValue("[Master]", "crossfader", -1.0);
    
    function safeDivide(numerator, denominator, defaultValue) {
        return denominator && Math.abs(denominator) > 0.001 
            ? numerator / denominator 
            : defaultValue;
    }

    function clamp(value, min, max) {
       return Math.min(Math.max(value, min), max);
    }

    function readUVBoostParameters() {
        var bassMax = 2.0;
        var midMax   = 1.8;
        var highMax  = 1.2;
        
        try {
            if (typeof engine.getValue === 'function') {
                var bassRaw = engine.getValue("[UV_Control]", "bass_boost_max");
                var midRaw   = engine.getValue("[UV_Control]", "mid_boost_max");
                var highRaw  = engine.getValue("[UV_Control]", "high_boost_max");
                
                if (bassRaw !== undefined && midRaw !== undefined && highRaw !== undefined) {
                    bassMax = Math.max(1.0, Math.min(bassRaw, 4.0));
                    midMax   = Math.max(1.0, Math.min(midRaw, 3.5));
                    highMax  = Math.max(1.0, Math.min(highRaw, 2.5));
                    
                    if (typeof console !== 'undefined') {
                        console.log("UV Boost Parameters loaded:", {
                            bass: bassMax.toFixed(1),
                            mid: midMax.toFixed(1),
                            high: highMax.toFixed(1)
                        });
                    }
                }
            }
        } catch (e) {
            if (typeof console !== 'undefined') {
                console.error("UV Parameter read error, using defaults:", e);
            }
        }
        
        return { bassMax: bassMax, midMax: midMax, highMax: highMax };
    }
    
    function updateActiveBoostValues() {
        var params = readUVBoostParameters();
        
        midiAutoDJ.bassBoostMax = params.bassMax;
        midiAutoDJ.midBoostMax  = params.midMax;
        midiAutoDJ.highBoostMax = params.highMax;
    }
    
    midiAutoDJ.readLiveBassBoost = function() {
        try {
            var liveValue = engine.getValue("[UV_Control]", "bass_boost_max");
            
            if (liveValue !== undefined && typeof liveValue === 'number') {
                return Math.max(1.0, Math.min(liveValue, 4.0));
            }
        } catch (e) {
            console.error("Live bass boost read error:", e);
        }
        return 2.0;
    };

    if (engine.connectControl("[AutoDJ]", "enabled", "midiAutoDJ.toggle")) {
        midiAutoDJ.connected = 1;
        engine.trigger("[AutoDJ]", "enabled");
    } else {
        midiAutoDJ.sleepTimer = engine.beginTimer(midiAutoDJ.sleepDuration, "midiAutoDJ.main()");
    }
};

midiAutoDJ.refreshUV = function() {
    updateActiveBoostValues();
};

midiAutoDJ.getUVParameters = function() {
    return {
        bassMax: midiAutoDJ.bassBoostMax,
        midMax:  midiAutoDJ.midBoostMax,
        highMax: midiAutoDJ.highBoostMax
    };
};

midiAutoDJ.setUVParameters = function(bass, mid, high) {
    bass  = Math.max(1.0, Math.min(bass || 2.0, 4.0));
    mid   = Math.max(1.0, Math.min(mid || 1.8, 3.5));
    high  = Math.max(1.0, Math.min(high || 1.2, 2.5));
    
    midiAutoDJ.bassBoostMax = bass;
    midiAutoDJ.midBoostMax  = mid;
    midiAutoDJ.highBoostMax = high;
    
    if (typeof console !== 'undefined') {
        console.log("UV Parameters manually set:", { bass, mid, high });
    }
};

midiAutoDJ.resetUVDefaults = function() {
    midiAutoDJ.setUVParameters(2.0, 1.8, 1.2);
    
    if (typeof console !== 'undefined') {
        console.log("UV Parameters reset to defaults: bass=2.0, mid=1.8, high=1.2");
    }
};

midiAutoDJ.getUVRefreshInterval = function() {
    return 5000; // 5 seconds (configurable)
};

midiAutoDJ.setUVRefreshInterval = function(ms) {
    ms = Math.max(1000, Math.min(ms || 5000, 30000)); // Clamp to reasonable range
    
    if (typeof engine.stopTimer === 'function' && midiAutoDJ.uvRefreshTimer) {
        engine.stopTimer(midiAutoDJ.uvRefreshTimer);
    }
    
    if (typeof engine.beginTimer === 'function') {
        midiAutoDJ.uvRefreshTimer = engine.beginTimer(ms, "midiAutoDJ.refreshUVParameters");
    }
    
    return ms;
};

midiAutoDJ.isUVActive = function() {
    return typeof midiAutoDJ.bassBoostMax === 'number' && 
           midiAutoDJ.bassBoostMax >= 1.0 && 
           midiAutoDJ.bassBoostMax <= 4.0;
};

midiAutoDJ.getUVState = function() {
    return {
        bassMax: midiAutoDJ.bassBoostMax,
        midMax:  midiAutoDJ.midBoostMax,
        highMax: midiAutoDJ.highBoostMax,
        isActive: midiAutoDJ.isUVActive(),
        refreshTimer: typeof midiAutoDJ.uvRefreshTimer === 'number' ? 'active' : 'inactive'
    };
};

midiAutoDJ.exportUVParameters = function() {
    return JSON.stringify({
        bassMax: midiAutoDJ.bassBoostMax,
        midMax:  midiAutoDJ.midBoostMax,
        highMax: midiAutoDJ.highBoostMax,
        timestamp: new Date().toISOString()
    });
};

midiAutoDJ.validateUVParameters = function(bass, mid, high) {
    var valid = true;
    var errors = [];
    
    if (bass < 1.0 || bass > 4.0) {
        valid = false;
        errors.push("Bass value out of range (1.0 - 4.0): " + bass);
    }
    if (mid < 1.0 || mid > 3.5) {
        valid = false;
        errors.push("Mid value out of range (1.0 - 3.5): " + mid);
    }
    if (high < 1.0 || high > 2.5) {
        valid = false;
        errors.push("High value out of range (1.0 - 2.5): " + high);
    }
    
    return { valid, errors };
};

midiAutoDJ.getUVPresets = function(genre) {
    var presets = {
        electronic:  { bass: 2.8, mid: 1.6, high: 1.4 },
        rock:        { bass: 2.2, mid: 1.9, high: 1.2 },
        jazz:        { bass: 1.8, mid: 2.0, high: 1.1 },
        hipHop:      { bass: 3.0, mid: 1.5, high: 1.3 },
        classical:   { bass: 1.6, mid: 2.1, high: 1.0 },
        default:     { bass: 2.0, mid: 1.8, high: 1.2 }
    };
    
    return presets[genre] || presets.default;
};

midiAutoDJ.applyUVGenrePreset = function(genre) {
    var preset = midiAutoDJ.getUVPresets(genre);
    midiAutoDJ.setUVParameters(preset.bass, preset.mid, preset.high);
    
    if (typeof console !== 'undefined') {
        console.log("Applied UV preset for " + genre + ": " + JSON.stringify(preset));
    }
};

midiAutoDJ.getUVDocumentation = function() {
    return "UV Boost Parameters - Dynamic EQ Control\n" +
           "Range: bass (1.0-4.0), mid (1.0-3.5), high (1.0-2.5)\n" +
           "Refresh Interval: 5000ms (configurable via setUVRefreshInterval())\n" +
           "Presets available via getUVPresets(genre)";
};

midiAutoDJ.getUVVersion = function() {
    return "2.1.0 - Dynamic Parameter Management with Genre Presets";
};

function readUVBoostParameters() {
    var bassMax = 2.0;   // Default: moderate bass boost
    var midMax   = 1.8;  // Default: moderate mid boost  
    var highMax  = 1.2;  // Default: mild high boost
    
    try {
        if (typeof engine.getValue === 'function') {
            var bassRaw = engine.getValue("[UV_Control]", "bass_boost_max");
            var midRaw   = engine.getValue("[UV_Control]", "mid_boost_max");
            var highRaw  = engine.getValue("[UV_Control]", "high_boost_max");
            
            if (bassRaw !== undefined && midRaw !== undefined && highRaw !== undefined) {
                bassMax = Math.max(1.0, Math.min(bassRaw, 4.0));
                midMax   = Math.max(1.0, Math.min(midRaw, 3.5));
                highMax  = Math.max(1.0, Math.min(highRaw, 2.5));
            }
        }
        
        if (typeof console !== 'undefined') {
            console.log("UV Boost Parameters:", { bass: bassMax, mid: midMax, high: highMax });
        }
    } catch (e) {
        console.error("UV Parameter read error:", e);
    }
    
    return { bassMax, midMax, highMax };
}

function updateActiveBoostValues() {
    var params = readUVBoostParameters();    
    midiAutoDJ.bassBoostMax = params.bassMax;
    midiAutoDJ.midBoostMax  = params.midMax;
    midiAutoDJ.highBoostMax = params.highMax;
}

midiAutoDJ.initUVParameters = function() {
    updateActiveBoostValues();
    midiAutoDJ.uvRefreshTimer = engine.beginTimer(5000, "midiAutoDJ.refreshUVParameters");
};

midiAutoDJ.refreshUVParameters = function() {
    updateActiveBoostValues();
};


midiAutoDJ.main = function() {
    var deck1Playing = engine.getValue("[Channel1]", "play_indicator");
    var deck2Playing = engine.getValue("[Channel2]", "play_indicator");
    var prev = 1;
    var next = 2;
    var prevPos = engine.getValue("[Channel"+prev+"]", "playposition");
    var nextPos = engine.getValue("[Channel"+next+"]", "playposition");

    if ( prevPos === -1 || nextPos === -1 ) { return; }

    function getActiveTrack() {
        if (deck1Playing && !deck2Playing) return 1;
        if (deck2Playing && !deck1Playing) return 2;
        return nextPos > prevPos ? 1 : 2;
    }

    var activeTrack = getActiveTrack();
    
    if (activeTrack === 1) {
        prev = 1; next = 2;
    } else if (activeTrack === 2) {
        prev = 2; next = 1;
        var tmpPos = nextPos; 
        nextPos = prevPos; 
        prevPos = tmpPos;
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

    var crossfader = engine.getValue("[Master]", "crossfader");
    var rawValue = engine.getValue("[Main]", "vu_meter");
    var vuLevel = typeof(rawValue) === 'number' ? rawValue : 0.5; // Default to middle
    crossfader = (crossfader+1.0)/2.0; 
    if ( next === 1 ) {
        crossfader = 1.0-crossfader;
    }

    var skip = 0;
    if (nextPlaying && nextPos > -0.15) {
        skip = 0;
        midiAutoDJ.songLoaded = 0;

        var bpmRange = 80;    // Range di riferimento BPM (es. 80-160)
        var intensityBase = 0.5;  // Intensità minima moltiplicatore
        var intensityMax = 2.0;   // Intensità massima moltiplicatore
        var currentIntensity = Math.min(intensityMax, Math.max(intensityBase, (nextBpm - bpmRange) / bpmRange + intensityBase));

        if (midiAutoDJ.useEQ) {
            
            var liveBassBoost = midiAutoDJ.readLiveBassBoost();
            var scaledBassBoost = liveBassBoost * currentIntensity;
            var scaledMidBoost = liveBassBoost * currentIntensity;  // Use same bass value for consistency
            var scaledHighBoost = liveBassBoost * currentIntensity; // Use same bass value for consistency

            if (crossfader < 0.35) {
                engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter1", 0.2);
            } else {
                var factorInB = (crossfader - 0.35) / 0.55;
                var nextBassVal = 0.2 + ((scaledBassBoost - 0.2) * factorInB);
                engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter1", Math.min(scaledBassBoost, nextBassVal));
            }
            if (crossfader < midiAutoDJ.thresholds.bassOut) {
                var factorOutB = crossfader / midiAutoDJ.thresholds.bassOut;
                var prevBassVal = scaledBassBoost * Math.cos(factorOutB * Math.PI / 4);
                engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter1", prevBassVal);
            } else {
                var factorOutBPost = (crossfader - midiAutoDJ.thresholds.bassOut) / (0.70 - midiAutoDJ.thresholds.bassOut);
                var bassCutStart = scaledBassBoost * Math.cos(Math.PI / 4);
                var prevBassValPost = bassCutStart * (1.0 - (factorOutBPost / (0.70 - midiAutoDJ.thresholds.bassOut)));
                engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter1", Math.max(0.0, prevBassValPost));
            }

            if (midiAutoDJ.useMidHighEQ) {
                var prevMidVal = scaledMidBoost * Math.cos(crossfader * Math.PI / 2);
                engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter2", Math.max(0.0, prevMidVal * vuLevel));
                
                var nextMidVal = 0.2 + ((scaledMidBoost - 0.2) * Math.sin(crossfader * Math.PI / 2));
                engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter2", Math.min(scaledMidBoost, nextMidVal));

                if (crossfader < 0.60) {
                    engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter3", scaledHighBoost);
                } else {
                    var factorOutH = (crossfader - 0.60) / 0.40;
                    var prevHighVal = scaledHighBoost * Math.cos(factorOutH * Math.PI / 2);
                    engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter3", Math.max(0.0, prevHighVal * vuLevel));
                }
                
                if (crossfader > 0.15) {
                    var factorInH = (crossfader - 0.15) / 0.85;
                    var nextHighVal = 0.2 + ((scaledHighBoost - 0.2) * Math.sin(factorInH * Math.PI / 2));
                    engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter3", Math.min(scaledHighBoost, nextHighVal));
                } else {
                    engine.setValue("[EqualizerRack1_[Channel"+next+"]_Effect1]", "parameter3", 0.2);
                }
            }
        }

        if (midiAutoDJ.useFilterFX) {
            var fxFloor = 1.0 - midiAutoDJ.filterFxIntensity;

            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "enabled", 1.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "enabled", 1.0);

            var filterCurvePrev = Math.cos(crossfader * Math.PI / 2) * vuLevel;
            var prevFxValue = 1.0 - ((1.0 - filterCurvePrev) * midiAutoDJ.filterFxIntensity);

            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "parameter1", 
                            midiAutoDJ.filterFxInvert ? (1.0 - prevFxValue) : prevFxValue);

            var filterCurveNext = Math.sin(crossfader * Math.PI / 2) * vuLevel;
            var nextFxValue = fxFloor + (filterCurveNext * midiAutoDJ.filterFxIntensity);

            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "parameter1", 
                            midiAutoDJ.filterFxInvert ? (1.0 - nextFxValue) : nextFxValue);

             var resonanceValue = 0.40 * Math.sin(crossfader * Math.PI) * vuLevel;
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "parameter2", resonanceValue);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "parameter2", resonanceValue);
    
            if (crossfader < midiAutoDJ.thresholds.reverbEnd) {
                engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "enabled", 1.0);
        
                var reverbProgress = crossfader / midiAutoDJ.thresholds.reverbEnd;
                var reverbVal = 0.45 * (1.0 - (reverbProgress * reverbProgress * (3 - 2 * reverbProgress))) * vuLevel;
                engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "drywet", reverbVal);
        
                var roomSize = 0.75 * Math.pow(1.0 - reverbProgress, 2);
                engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "parameter2", roomSize);
            } else {
                engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "drywet", 0.0);
                engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "enabled", 0.0);
            }        

            var echoFactor = typeof crossfader === 'number' 
                ? Math.max(0.0, Math.min(1.0, crossfader)) 
                : 0.5;

            var echoIntensity = 0.90 * vuLevel;
            var echoTimeBase = 0.20 + (0.50 * Math.pow(echoFactor, 1.5));
            var echoFeedbackBase = 0.40 + (0.35 * Math.sin(echoFactor * Math.PI / 2));

            if (nextPlaying && nextPos > -0.15) {
                engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "enabled", 1.0);
                engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "drywet", echoIntensity);                    
                engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "parameter2", echoTimeBase);
                engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "parameter3", echoFeedbackBase);
            } else {            
                engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "enabled", 1.0);
                engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "drywet", echoIntensity * 0.7);
                engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "parameter2", echoTimeBase * 1.2);
                engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "parameter3", echoFeedbackBase * 0.9);
            }        

        }

    } else { 

        var bpmRange = 80;
        var intensityBase = 0.5;
        var intensityMax = 2.0;
        var currentIntensity = Math.min(intensityMax, Math.max(intensityBase, (nextBpm - bpmRange) / bpmRange + intensityBase));
        
        var liveBassBoost = midiAutoDJ.readLiveBassBoost();
        var scaledBassBoost = liveBassBoost * currentIntensity;
        var scaledMidBoost = liveBassBoost * currentIntensity;  // Use same bass value for consistency
        var scaledHighBoost = liveBassBoost * currentIntensity; // Use same bass value for consistency
    
        if (midiAutoDJ.useEQ) {
            if (deck1Playing) {
                engine.setValue("[EqualizerRack1_[Channel1]_Effect1]", "parameter1", scaledBassBoost);
                if (midiAutoDJ.useMidHighEQ) {
                    engine.setValue("[EqualizerRack1_[Channel1]_Effect1]", "parameter2", scaledMidBoost);
                    engine.setValue("[EqualizerRack1_[Channel1]_Effect1]", "parameter3", scaledHighBoost);
                }
            }
            if (deck2Playing) {
                engine.setValue("[EqualizerRack1_[Channel2]_Effect1]", "parameter1", scaledBassBoost);
                if (midiAutoDJ.useMidHighEQ) {
                    engine.setValue("[EqualizerRack1_[Channel2]_Effect1]", "parameter2", scaledMidBoost);
                    engine.setValue("[EqualizerRack1_[Channel2]_Effect1]", "parameter3", scaledHighBoost);
                }
            }
        }
        if (midiAutoDJ.useFilterFX && midiAutoDJ.echoEnabledInSolo) {
            var bpmRange = 80;
            var intensityBase = 0.5;
            var intensityMax = 1.5;
            var currentIntensity = Math.min(intensityMax, Math.max(intensityBase, (nextBpm - bpmRange) / bpmRange + intensityBase));
            var liveBassBoost = midiAutoDJ.readLiveBassBoost();
            var scaledEchoIntensity = liveBassBoost * currentIntensity;
    
            if (deck1Playing) {
                engine.setValue("[EffectRack1_EffectUnit1_QuickEffect]", "enabled", 1.0);
                engine.setValue("[EffectRack1_EffectUnit1_QuickEffect]", "drywet", 0.35 * vuLevel);
                engine.setValue("[EffectRack1_EffectUnit1_QuickEffect]", "parameter2", 0.4 + (0.3 * currentIntensity));
                engine.setValue("[EffectRack1_EffectUnit1_QuickEffect]", "parameter3", 0.35 + (0.25 * currentIntensity));
            }
    
            if (deck2Playing) {
                engine.setValue("[EffectRack1_EffectUnit2_QuickEffect]", "enabled", 1.0);
                engine.setValue("[EffectRack1_EffectUnit2_QuickEffect]", "drywet", 0.35 * vuLevel);
                engine.setValue("[EffectRack1_EffectUnit2_QuickEffect]", "parameter2", 0.4 + (0.3 * currentIntensity));
                engine.setValue("[EffectRack1_EffectUnit2_QuickEffect]", "parameter3", 0.35 + (0.25 * currentIntensity));
            }
        } else {
            if (deck1Playing) {
                engine.setValue("[EffectRack1_EffectUnit1_QuickEffect]", "enabled", 0.0);
                engine.setValue("[EffectRack1_EffectUnit1_QuickEffect]", "drywet", 0.0);
            }
            if (deck2Playing) {
                engine.setValue("[EffectRack1_EffectUnit2_QuickEffect]", "enabled", 0.0);
                engine.setValue("[EffectRack1_EffectUnit2_QuickEffect]", "drywet", 0.0);
            }
        }


        if (midiAutoDJ.useFilterFX) {
            var fxOpenValue = midiAutoDJ.filterFxInvert ? 0.0 : 1.0;
            
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "parameter1", fxOpenValue);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "parameter2", 0.0); // Risonanza spenta
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "enabled", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "drywet", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "parameter2", 0.0); // Stanza azzerata
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "enabled", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "drywet", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "parameter2", 0.0); // Tempo echo resettato
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "parameter3", 0.0); // Feedback echo resettato
            engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "enabled", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "parameter1", fxOpenValue);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "parameter2", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "enabled", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "drywet", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "parameter2", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "enabled", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "drywet", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "parameter2", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "parameter3", 0.0);
            engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "enabled", 0.0);
        }

        if ( midiAutoDJ.fadeQuickEffect ) {
            engine.setValue("[QuickEffectRack1_[Channel"+next+"]]", "super1", 0.5+midiAutoDJ.fadeRange/2.0);
            engine.setValue("[QuickEffectRack1_[Channel"+prev+"]]", "super1", 0.5);
        }

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


        skip = 0;
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

                var meetingPointBpm = (prevBpm + nextBpm) / 2.0;
                engine.setValue("[Channel"+prev+"]", "bpm", meetingPointBpm);
                engine.setValue("[Channel"+next+"]", "bpm", meetingPointBpm);

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

                if (midiAutoDJ.useEQ) {
                    var liveBassBoost = midiAutoDJ.readLiveBassBoost();
                    engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter1", liveBassBoost);
                    if (midiAutoDJ.useMidHighEQ) {
                        engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter2", liveBassBoost);
                        engine.setValue("[EqualizerRack1_[Channel"+prev+"]_Effect1]", "parameter3", liveBassBoost);
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
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect1]", "parameter2", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "enabled", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "drywet", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_Effect2]", "parameter2", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "enabled", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "drywet", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "parameter2", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + prev + "_QuickEffect]", "parameter3", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "enabled", 1.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "parameter1", midiAutoDJ.filterFxInvert ? (1.0 - fxFloorStart) : fxFloorStart);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect1]", "parameter2", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "enabled", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "drywet", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_Effect2]", "parameter2", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "enabled", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "drywet", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "parameter2", 0.0);
                    engine.setValue("[EffectRack1_EffectUnit" + next + "_QuickEffect]", "parameter3", 0.0);
                }
            }
        }
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
