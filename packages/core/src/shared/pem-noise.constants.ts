/** The PEM BEGIN and END lines and all whitespace: everything but the base64 body. */
export const PEM_NOISE: RegExp = /-----(?:BEGIN|END) [\w\s]+-----|\s+/g;
