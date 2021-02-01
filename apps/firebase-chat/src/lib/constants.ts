export const IS_PRODUCTION = import.meta.env.MODE === 'production';

export const IS_NOT_PRODUCTION = !IS_PRODUCTION;

export const ENTER_MODAL_ID = 'enter-modal';

export const NON_EXISTANT_DOM_ID = 'NON_EXISTANT_DOM_ID';

export const NON_EXISTANT_DOM_HREF = `#${NON_EXISTANT_DOM_ID}`;
