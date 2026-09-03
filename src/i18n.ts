export type Locale = "en" | "pl";

type TranslationKeys = {
    // Popup
    title: string;
    welcome: string;
    supportPrompt: string;
    supportPromptOr: string;
    providerLabel: string;
    providerDescription: string;
    apiKeyLabel: string;
    apiKeyDescription: string;
    apiKeyPlaceholder: string;
    apiKeyLabelOpenAI: string;
    apiKeyLabelGemini: string;
    apiKeyLabelClaude: string;
    apiKeyPlaceholderOpenAI: string;
    apiKeyPlaceholderGemini: string;
    apiKeyPlaceholderClaude: string;
    workspaceIdLabelClaude: string;
    workspaceIdDescriptionClaude: string;
    testApiKey: string;
    validatingKey: string;
    keyValid: string;
    keyInvalid: string;
    modelLabel: string;
    modelDescription: string;
    modelLoading: string;
    modelError: string;
    modelSetKeyFirst: string;
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
    fileProviderMismatchWarning: string;
    fileExpiredWarning: string;

    // Auto-solve buttons
    autoSolve: string;
    solving: string;
    downloadingImage: string;
    apiError: string;

    // Error messages
    errorApiKeyNotSet: string;
    errorGeminiQuota: string;
    errorGeminiRetry: string;
    errorGeminiBilling: string;
    errorClaudeCredits: string;
    errorClaudeWorkspaceId: string;
};

const translations: Record<Locale, TranslationKeys> = {
    en: {
        // Popup
        title: "AntiTestportal GPT",
        welcome: "Welcome to AntiTestportal GPT. When you enter any test (on Testportal or Moodle), you should see \"Auto-solve\" button at the bottom of the question. Click it to let the plugin generate an answer for you.",
        supportPrompt: "If you like the extension, please consider supporting me by buying me a virtual coffee on",
        supportPromptOr: "or via",
        providerLabel: "AI provider:",
        providerDescription: "Choose the AI provider you want to use for generating answers.",
        apiKeyLabel: "API key:",
        apiKeyDescription: "AntiTestportal GPT requires your own API key in order to work. You can test the key using the button below (please note that it will trigger an API request, for which you will be charged).",
        apiKeyPlaceholder: "sk-...",
        apiKeyLabelOpenAI: "OpenAI API key:",
        apiKeyLabelGemini: "Gemini API key:",
        apiKeyLabelClaude: "Anthropic API key:",
        apiKeyPlaceholderOpenAI: "sk-...",
        apiKeyPlaceholderGemini: "AI...",
        apiKeyPlaceholderClaude: "sk-ant-...",
        workspaceIdLabelClaude: "Workspace ID (optional):",
        workspaceIdDescriptionClaude: "If you are using an Identity-linked (user) API key, you must provide your Workspace ID. Leave this empty if you use a standard Workspace key.",
        testApiKey: "Test API key",
        validatingKey: "Please wait, API key validation in progress...",
        keyValid: "API key is valid! Response:",
        keyInvalid: "API key is invalid... Response:",
        modelLabel: "AI model:",
        modelDescription: "Choose the model you want to use for generating answers. Please note that the model you choose will affect the quality of the answers and the cost of the API requests.",
        modelLoading: "Loading models...",
        modelError: "Failed to load models.",
        modelSetKeyFirst: "Set your API key first to load available models.",
        antiTamperingLabel: "Block \"honest respondent\" feature:",
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
        contextDescription: "Create and manage contexts with text and file attachments. Files will be uploaded to the selected AI provider and used to answer questions.",
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
        setApiKeyFirst: "Please set your API key first.",
        failedToUpload: "Failed to upload file.",
        fileProviderMismatchWarning: "This file was uploaded to a different AI provider and will not be used with the current one.",
        fileExpiredWarning: "This file has expired on the provider's servers. Please remove and re-upload it.",

        // Auto-solve buttons
        autoSolve: "Auto-solve question",
        solving: "Solving...",
        downloadingImage: "Downloading image...",
        apiError: "Some error happened during the API communication...",

        // Error messages
        errorApiKeyNotSet: "API key is not set in AntiTestportal GPT plugin configuration.",
        errorClaudeCredits: "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.",
        errorClaudeWorkspaceId: "Your identity-linked API key requires a Workspace ID. Please provide it in the plugin settings just below the API key."
    },
    pl: {
        // Popup
        title: "AntiTestportal GPT",
        welcome: "Witaj w AntiTestportal GPT. Po wejściu na dowolny test (na stronie Testportal lub Moodle), powinieneś zobaczyć przycisk \"Rozwiąż automatycznie\" na dole pytania. Kliknij go, aby wtyczka wygenerowała odpowiedź.",
        supportPrompt: "Jeśli podoba Ci się rozszerzenie, rozważ wsparcie mnie poprzez zakup wirtualnej kawy na",
        supportPromptOr: "lub poprzez",
        providerLabel: "Dostawca AI:",
        providerDescription: "Wybierz dostawcę AI, którego chcesz używać do generowania odpowiedzi.",
        apiKeyLabel: "Klucz API:",
        apiKeyDescription: "AntiTestportal GPT wymaga własnego klucza API do działania. Możesz przetestować klucz za pomocą przycisku poniżej (uwaga: spowoduje to wysłanie zapytania API, za które zostaniesz obciążony).",
        apiKeyPlaceholder: "sk-...",
        apiKeyLabelOpenAI: "Klucz API OpenAI:",
        apiKeyLabelGemini: "Klucz API Gemini:",
        apiKeyLabelClaude: "Klucz API Anthropic:",
        apiKeyPlaceholderOpenAI: "sk-...",
        apiKeyPlaceholderGemini: "AI...",
        apiKeyPlaceholderClaude: "sk-ant-...",
        workspaceIdLabelClaude: "Workspace ID (opcjonalnie):",
        workspaceIdDescriptionClaude: "Jeśli używasz klucza API przypisanego do użytkownika (identity-linked), musisz podać ID swojego obszaru roboczego (workspace ID). Jeśli używasz standardowego klucza, pozostaw to pole puste.",
        testApiKey: "Przetestuj klucz API",
        validatingKey: "Proszę czekać, trwa walidacja klucza API...",
        keyValid: "Klucz API jest prawidłowy! Odpowiedź:",
        keyInvalid: "Klucz API jest nieprawidłowy... Odpowiedź:",
        modelLabel: "Model AI:",
        modelDescription: "Wybierz model, którego chcesz używać do generowania odpowiedzi. Pamiętaj, że wybrany model wpływa na jakość odpowiedzi i koszt zapytań API.",
        modelLoading: "Ładowanie modeli...",
        modelError: "Nie udało się załadować modeli.",
        modelSetKeyFirst: "Najpierw ustaw klucz API, aby załadować dostępne modele.",
        antiTamperingLabel: "Zablokuj funkcję \"uczciwy rozwiązujący\":",
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
        contextDescription: "Twórz i zarządzaj kontekstami z tekstem i załącznikami. Pliki zostaną przesłane do wybranego dostawcy AI i użyte do odpowiadania na pytania.",
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
        setApiKeyFirst: "Najpierw ustaw klucz API.",
        failedToUpload: "Nie udało się przesłać pliku.",
        fileProviderMismatchWarning: "Ten plik został przesłany do innego dostawcy AI i nie będzie używany z obecnym.",
        fileExpiredWarning: "Ten plik wygasł na serwerach dostawcy. Proszę go usunąć i przesłać ponownie.",

        // Auto-solve buttons
        autoSolve: "Rozwiąż automatycznie",
        solving: "Rozwiązywanie...",
        downloadingImage: "Pobieranie obrazu...",
        apiError: "Wystąpił błąd podczas komunikacji z API...",

        // Error messages
        errorApiKeyNotSet: "Klucz API nie jest ustawiony w konfiguracji wtyczki AntiTestportal GPT.",
        errorGeminiQuota: "Przekroczono limit zapytań (quota) lub nałożono blokadę (rate limit) dla API Gemini.",
        errorGeminiRetry: "Spróbuj ponownie za {0} sekund.",
        errorGeminiBilling: "(Modele Pro często wymagają skonfigurowania płatności w Google AI Studio).",
        errorClaudeCredits: "Brak wystarczających środków na koncie, aby skorzystać z API Claude. Doładuj swoje konto w zakładce Plans & Billing.",
        errorClaudeWorkspaceId: "Twój klucz API (Identity-linked) wymaga podania Workspace ID. Skopiuj go z konsoli Anthropic i wklej w ustawieniach wtyczki tuż poniżej klucza."
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
