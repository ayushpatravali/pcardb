"""Number formatting helpers for the printed documents.

- indian_format: 1130000 -> "11,30,000"
- amount_in_words_kn: 1130000 -> "ಹನ್ನೊಂದು ಲಕ್ಷ ಮೂವತ್ತು ಸಾವಿರ ರೂಪಾಯಿಗಳು"
"""

ONES_KN = [
    "", "ಒಂದು", "ಎರಡು", "ಮೂರು", "ನಾಲ್ಕು", "ಐದು", "ಆರು", "ಏಳು", "ಎಂಟು", "ಒಂಬತ್ತು",
    "ಹತ್ತು", "ಹನ್ನೊಂದು", "ಹನ್ನೆರಡು", "ಹದಿಮೂರು", "ಹದಿನಾಲ್ಕು", "ಹದಿನೈದು",
    "ಹದಿನಾರು", "ಹದಿನೇಳು", "ಹದಿನೆಂಟು", "ಹತ್ತೊಂಬತ್ತು",
]
TENS_KN = [
    "", "", "ಇಪ್ಪತ್ತು", "ಮೂವತ್ತು", "ನಲವತ್ತು", "ಐವತ್ತು", "ಅರವತ್ತು", "ಎಪ್ಪತ್ತು",
    "ಎಂಬತ್ತು", "ತೊಂಬತ್ತು",
]


def _two_digits_kn(n: int) -> str:
    if n < 20:
        return ONES_KN[n]
    tens, ones = divmod(n, 10)
    if ones == 0:
        return TENS_KN[tens]
    # Kannada compounds: 21 = ಇಪ್ಪತ್ತೊಂದು etc. Use the simple joined form.
    return TENS_KN[tens] + " " + ONES_KN[ones]


def _three_digits_kn(n: int) -> str:
    hundreds, rest = divmod(n, 100)
    parts = []
    if hundreds:
        parts.append(ONES_KN[hundreds] + " ನೂರ" if rest else ONES_KN[hundreds] + " ನೂರು")
    if rest:
        parts.append(_two_digits_kn(rest))
    return " ".join(parts)


def amount_in_words_kn(amount) -> str:
    """Integer rupee amount to Kannada words (Indian system: crore/lakh/thousand)."""
    try:
        n = int(round(float(amount)))
    except (TypeError, ValueError):
        return ""
    if n == 0:
        return "ಸೊನ್ನೆ ರೂಪಾಯಿಗಳು"
    parts = []
    crore, n = divmod(n, 10_000_000)
    lakh, n = divmod(n, 100_000)
    thousand, n = divmod(n, 1000)
    if crore:
        parts.append(_two_digits_kn(crore) + " ಕೋಟಿ")
    if lakh:
        parts.append(_two_digits_kn(lakh) + " ಲಕ್ಷ")
    if thousand:
        parts.append(_two_digits_kn(thousand) + " ಸಾವಿರ")
    if n:
        parts.append(_three_digits_kn(n))
    return " ".join(parts) + " ರೂಪಾಯಿಗಳು"


def indian_format(value) -> str:
    """Indian digit grouping: 1130000 -> 11,30,000. Non-numbers pass through."""
    if value is None or value == "":
        return ""
    try:
        n = float(value)
    except (TypeError, ValueError):
        return str(value)
    neg = n < 0
    n = abs(n)
    whole = int(n)
    frac = round(n - whole, 2)
    s = str(whole)
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        s = ",".join(groups + [tail])
    if frac:
        s += f"{frac:.2f}"[1:]  # ".50"
    return ("-" if neg else "") + s
