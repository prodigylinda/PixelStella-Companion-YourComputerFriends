export function initialState() {
    return { version: 1,
        avatar: { mode: 'custom', assetId: null, name: 'Stella', species: 'cat', hair: 'short', expression: 'smile', skin: '#ffddc9', hairColor: '#493d5c', outfit: '#9bb3ff', accent: '#ffd584', accessory: 'star' },
        reminders: [], receipts: [],
        settings: { locale: 'zh', showPet: true, alwaysOnTop: true, quiet: false, petScale: 100, aiBase: 'http://127.0.0.1:7860' },
        focus: { duration: 25 * 60, remaining: 25 * 60, deadline: null }
    };
}
