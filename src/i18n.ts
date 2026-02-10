export type Locale = "en" | "pl";

type TranslationKeys = {
    // Popup
    title: string;
    welcome: string;
    supportPrompt: string;
    apiKeyLabel: string;
    apiKeyDescription: string;
    apiKeyPlaceholder: string;
    testApiKey: string;
    validatingKey: string;
    keyValid: string;
    keyInvalid: string;
    modelLabel: string;
    modelDescription: string;
    antiTamperingLabel: string;
    antiTamperingDescription: string;
    enable: string;
    visibilityLabel: string;
    visibilityDescription: string;
    visibilityVisible: string;
    visibilityBarelyVisible: string;
    visibilityInvisible: string;
    visibilityWarning: string;

    // Context Manager
    contextLabel: string;
    contextDescription: string;
    noContextSelected: string;
    newContextPlaceholder: string;
    create: string;
    textContentLabel: string;
    textContentPlaceholder: string;
    filesLabel: string;
    uploading: string;
    deleteContext: string;
    deleting: string;
    removeFile: string;
    setApiKeyFirst: string;
    failedToUpload: string;

    // Auto-solve buttons
    autoSolve: string;
    solving: string;
    downloadingImage: string;
    apiError: string;

    // Error messages
    errorApiKeyNotSet: string;
};

const translations: Record<Locale, TranslationKeys> = {
    en: {
        // Popup
        title: "AntiTestportal GPT",
        welcome: "Welcome to AntiTestportal GPT. When you enter any Testportal test, you should see \"Auto-solve\" button at the bottom of the question. Click it to let the plugin generate an answer for you.",
        supportPrompt: "If you like the extension, please consider supporting me by buying me a virtual coffee at",
        apiKeyLabel: "OpenAI API key:",
        apiKeyDescription: "AntiTestportal GPT requires your own API key in order to work. You can get one from OpenAI website. You can test the key using the button below (please note that it will trigger an API request, for which you will be charged).",
        apiKeyPlaceholder: "sk-...",
        testApiKey: "Test API key",
        validatingKey: "Please wait, API key validation in progress...",
        keyValid: "API key is valid! Response:",
        keyInvalid: "API key is invalid... Response:",
        modelLabel: "OpenAI API model:",
        modelDescription: "Choose the model you want to use for generating answers. Please note that the model you choose will affect the quality of the answers and the cost of the API requests.",
        antiTamperingLabel: "Anti-anti-tampering:",
        antiTamperingDescription: "Testportal has a mechanism that detects when you leave the page. When you enable this option, the plugin will try to prevent this feature from working.",
        enable: "Enable",
        visibilityLabel: "Auto-solve button visibility:",
        visibilityDescription: "When set to \"Barely visible\", auto-solve button will be given 95% transparency so that it does not attract attention. You can also hide the button completely by setting this option to \"Invisible\".",
        visibilityVisible: "Visible",
        visibilityBarelyVisible: "Barely visible",
        visibilityInvisible: "Invisible",
        visibilityWarning: "Warning: Now auto-solve button will be completely invisible! You can still click it, but it won't be visible. If you don't know where the button normally is, it is recommended to switch this option to \"Barely visible\" or \"visible\".",

        // Context Manager
        contextLabel: "Context management:",
        contextDescription: "Create and manage contexts with text and file attachments. Files will be uploaded to OpenAI and used to answer questions.",
        noContextSelected: "-- No context selected --",
        newContextPlaceholder: "New context name...",
        create: "Create",
        textContentLabel: "Text content:",
        textContentPlaceholder: "Add text context that will be included in prompts...",
        filesLabel: "Files:",
        uploading: "Uploading...",
        deleteContext: "Delete context",
        deleting: "Deleting...",
        removeFile: "Remove file",
        setApiKeyFirst: "Please set your OpenAI API key first.",
        failedToUpload: "Failed to upload file.",

        // Auto-solve buttons
        autoSolve: "Auto-solve question",
        solving: "Solving...",
        downloadingImage: "Downloading image...",
        apiError: "Some error happened during the API communication...",

        // Error messages
        errorApiKeyNotSet: "API key is not set in AntiTestportal GPT plugin configuration."
    },
    pl: {
        // Popup
        title: "AntiTestportal GPT",
        welcome: "Witaj w AntiTestportal GPT. Po wejściu na dowolny test (na stronie Testportal lub Moodle), powinieneś zobaczyć przycisk \"Rozwiąż automatycznie\" na dole pytania. Kliknij go, aby wtyczka wygenerowała odpowiedź.",
        supportPrompt: "Jeśli podoba Ci się rozszerzenie, rozważ wsparcie mnie poprzez zakup wirtualnej kawy na",
        apiKeyLabel: "Klucz API OpenAI:",
        apiKeyDescription: "AntiTestportal GPT wymaga własnego klucza API do działania. Możesz go uzyskać na stronie OpenAI. Możesz przetestować klucz za pomocą poniższego przycisku (uwaga: spowoduje to wysłanie zapytania API, za które zostaniesz obciążony).",
        apiKeyPlaceholder: "sk-...",
        testApiKey: "Przetestuj klucz API",
        validatingKey: "Proszę czekać, trwa walidacja klucza API...",
        keyValid: "Klucz API jest prawidłowy! Odpowiedź:",
        keyInvalid: "Klucz API jest nieprawidłowy... Odpowiedź:",
        modelLabel: "Model API OpenAI:",
        modelDescription: "Wybierz model, którego chcesz używać do generowania odpowiedzi. Pamiętaj, że wybrany model wpływa na jakość odpowiedzi i koszt zapytań API.",
        antiTamperingLabel: "Anti-anti-tampering:",
        antiTamperingDescription: "Testportal posiada mechanizm wykrywający opuszczenie strony. Po włączeniu tej opcji, wtyczka spróbuje zablokować działanie tej funkcji.",
        enable: "Włącz",
        visibilityLabel: "Widoczność przycisku auto-rozwiązywania:",
        visibilityDescription: "Przy ustawieniu \"Ledwo widoczny\", przycisk auto-rozwiązywania będzie miał 95% przezroczystość, aby nie przyciągał uwagi. Możesz też całkowicie ukryć przycisk ustawiając opcję \"Niewidoczny\".",
        visibilityVisible: "Widoczny",
        visibilityBarelyVisible: "Ledwo widoczny",
        visibilityInvisible: "Niewidoczny",
        visibilityWarning: "Uwaga: Przycisk auto-rozwiązywania będzie teraz całkowicie niewidoczny! Nadal możesz go kliknąć, ale nie będzie widoczny. Jeśli nie wiesz, gdzie normalnie znajduje się przycisk, zaleca się zmianę tej opcji na \"Ledwo widoczny\" lub \"Widoczny\".",

        // Context Manager
        contextLabel: "Zarządzanie kontekstem:",
        contextDescription: "Twórz i zarządzaj kontekstami z tekstem i załącznikami. Pliki zostaną przesłane do OpenAI i użyte do odpowiadania na pytania.",
        noContextSelected: "-- Brak wybranego kontekstu --",
        newContextPlaceholder: "Nazwa nowego kontekstu...",
        create: "Utwórz",
        textContentLabel: "Treść tekstowa:",
        textContentPlaceholder: "Dodaj tekst kontekstu, który zostanie dołączony do promptów...",
        filesLabel: "Pliki:",
        uploading: "Przesyłanie...",
        deleteContext: "Usuń kontekst",
        deleting: "Usuwanie...",
        removeFile: "Usuń plik",
        setApiKeyFirst: "Najpierw ustaw klucz API OpenAI.",
        failedToUpload: "Nie udało się przesłać pliku.",

        // Auto-solve buttons
        autoSolve: "Rozwiąż automatycznie",
        solving: "Rozwiązywanie...",
        downloadingImage: "Pobieranie obrazu...",
        apiError: "Wystąpił błąd podczas komunikacji z API...",

        // Error messages
        errorApiKeyNotSet: "Klucz API nie jest ustawiony w konfiguracji wtyczki AntiTestportal GPT."
    }
};

/**
 * Detects the current browser locale
 * @returns "pl" for Polish browsers, "en" for all others
 */
export function detectLocale(): Locale {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith("pl")) {
        return "pl";
    }
    return "en";
}

// Current locale (detected once at module load)
let currentLocale: Locale = detectLocale();

/**
 * Get the current locale
 */
export function getLocale(): Locale {
    return currentLocale;
}

/**
 * Override the current locale (useful for testing)
 */
export function setLocale(locale: Locale): void {
    currentLocale = locale;
}

/**
 * Get a translated string by key
 * @param key The translation key
 * @returns The translated string in the current locale
 */
export function t(key: keyof TranslationKeys): string {
    return translations[currentLocale][key];
}

/**
 * Get all translations for the current locale
 */
export function getTranslations(): TranslationKeys {
    return translations[currentLocale];
}

export default t;
