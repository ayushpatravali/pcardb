// Kannada-only display helpers for the ಕನ್ನಡಕ್ಕೆ ಬದಲಿಸಿ mode.
// These transform DISPLAY strings only — stored form values never change
// (the backend contract and the PDF's kn_display mapping depend on them).

export const hasKannada = (s) => /[ಀ-೿]/.test(s || '');

// Fallbacks for English-only option words that have no Kannada half.
const WORD_KN = {
    Other: 'ಇತರೆ', Male: 'ಪುರುಷ', Female: 'ಮಹಿಳೆ',
    Sugarcane: 'ಕಬ್ಬು', Rice: 'ಭತ್ತ', Jowar: 'ಹೈಬ್ರಿಡ್ ಜೋಳ', Maize: 'ಮುಸುಕಿನಜೋಳ',
    Wheat: 'ಗೋಧಿ', Cotton: 'ಹೈಬ್ರಿಡ್ ಹತ್ತಿ', Groundnut: 'ಸೇಂಗಾ', Sunflower: 'ಸೂರ್ಯಕಾಂತಿ',
    Soybean: 'ಸೋಯಾಬೀನ್', Tomato: 'ಟೊಮ್ಯಾಟೋ', Onion: 'ಈರುಳ್ಳಿ', Chilli: 'ಮೆಣಸಿನಕಾಯಿ',
    Banana: 'ಬಾಳೆ', Grapes: 'ದ್ರಾಕ್ಷಿ (ಬೀಜ ರಹಿತ)',
};

/**
 * Bilingual field label -> Kannada-only.
 * "ಜಾತಿ — Caste"                       -> "ಜಾತಿ"
 * "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ — Mobile *"           -> "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *"
 * "ಕೋಟೇಶನ್ — Quotation (₹)"            -> "ಕೋಟೇಶನ್ (₹)"
 * "ಬೆಳೆ ವಿವರ — Crop Details (ವಾರ್ಷಿಕ ಬೆಳೆ)" -> "ಬೆಳೆ ವಿವರ (ವಾರ್ಷಿಕ ಬೆಳೆ)"
 */
export function knLabel(label) {
    if (!label) return label;
    if (!label.includes('—')) {
        // no bilingual dash: just drop English-only parentheticals ("ಸೇರಿಸಿ (Add)")
        return label.replace(/\s*\(([^)]*)\)/g, (m, inner) =>
            hasKannada(inner) || /\d|₹|HP|ಎಚ್/i.test(inner) ? m : ''
        ).trim();
    }
    const [kn, ...restParts] = label.split('—');
    const rest = restParts.join('—');
    let out = kn.trim();
    // keep any Kannada-containing parenthetical from the English half
    const knParens = (rest.match(/\(([^)]*)\)/g) || []).filter(hasKannada);
    if (knParens.length) out += ' ' + knParens.join(' ');
    if (/₹/.test(rest) && !/₹/.test(out)) out += ' (₹)';
    if (/\*\s*$/.test(label) && !/\*\s*$/.test(out)) out += ' *';
    return out;
}

/**
 * Bilingual option label -> Kannada-only (display only, value untouched).
 * "General / ಸಾಮಾನ್ಯ"      -> "ಸಾಮಾನ್ಯ"
 * "ಕಾಲುವೆ (Canal)"          -> "ಕಾಲುವೆ"
 * "ಕಬ್ಬು (Sugarcane)"       -> "ಕಬ್ಬು"
 * "Other"                   -> "ಇತರೆ"
 * "(5 HP)" style markers are kept.
 */
export function knOption(label) {
    if (!label) return label;
    let s = String(label);
    if (WORD_KN[s.trim()]) return WORD_KN[s.trim()];
    if (s.includes(' / ')) {
        const kn = s.split(' / ').map(p => p.trim()).filter(hasKannada);
        if (kn.length) s = kn.join(' / ');
    }
    s = s.replace(/\s*\(([^)]*)\)/g, (m, inner) =>
        hasKannada(inner) || /\d|HP|ಎಚ್/i.test(inner) ? m : ''
    );
    return s.trim() || label;
}
