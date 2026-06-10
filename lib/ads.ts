export const AD_SLOTS = {
  bottomBanner: 'ca-pub-XXXXXXXX/bottom-banner',
  routeCard: 'ca-pub-XXXXXXXX/route-card-native',
  routeModal: 'ca-pub-XXXXXXXX/route-modal',
} as const;

export function shouldShowAd(index: number, frequency = 8): boolean {
  return index > 0 && index % frequency === 0;
}
