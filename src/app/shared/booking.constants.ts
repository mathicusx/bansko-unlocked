/**
 * Minimum riders/participants required to complete a booking checkout.
 * Enforced in the checkout validation of both tour-detail and
 * buggy-tour-detail, mirrored by the `min` attribute on the riders input
 * and surfaced to the user via the `ridersHint` i18n string.
 */
export const MIN_RIDERS = 3;
