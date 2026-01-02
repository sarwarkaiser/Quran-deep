export interface TanzilAyah {
    $: {
        index: string;
        text: string;
        bismillah?: string;
    }
}

export interface TanzilSurah {
    $: {
        index: string;
        name: string;
    };
    aya: TanzilAyah[];
}

export interface TanzilQuran {
    quran: {
        sura: TanzilSurah[];
    }
}
