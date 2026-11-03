/** bar widths worked out from a string, so the barcode really is "of" what it labels */
export const barcode = (text: string) =>
    Array.from(text).flatMap((ch) => {
        const c = ch.charCodeAt(0);
        return [1 + (c % 3), 1 + ((c >> 2) % 2), 1 + ((c >> 3) % 3), 1 + ((c >> 1) % 2)];
    });
