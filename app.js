// ===== CONFIGURACIÓN =====
const SUPABASE_URL = 'https://sgnijgopojlkuhoootsm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnbmlqZ29wb2psa3Vob29vdHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjg3MzEsImV4cCI6MjA3ODc0NDczMX0.TTUxAE1zHAJe2DnSgWRKSFLYecr1tx0A-zHR_DE46Ag';

// ===== INICIALIZACIÓN =====
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== ELEMENTOS DOM =====
const loginScreen = document.getElementById('loginScreen');
const appScreen = document.getElementById('appScreen');
const loadingScreen = document.getElementById('loadingScreen');

const loginForm = document.getElementById('loginForm');
const expenseForm = document.getElementById('expenseForm');
const logoutBtn = document.getElementById('logoutBtn');

const loginError = document.getElementById('loginError');
const expenseError = document.getElementById('expenseError');
const expenseSuccess = document.getElementById('expenseSuccess');

// ===== STORAGE HELPERS =====
const Storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },

    get: (key) => {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return null;
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage:', e);
        }
    }
};

// ===== AUTH HELPERS =====
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

async function autoLogin() {
    const savedEmail = Storage.get('user_email');
    const savedPassword = Storage.get('user_password');

    if (savedEmail && savedPassword) {
        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: atob(savedEmail),
                password: atob(savedPassword)
            });

            if (error) throw error;
            return data.session;
        } catch (e) {
            // Si falla el auto-login, limpiar credenciales
            Storage.remove('user_email');
            Storage.remove('user_password');
            return null;
        }
    }
    return null;
}

// ===== UI HELPERS =====
function showScreen(screen) {
    [loginScreen, appScreen, loadingScreen].forEach(s => s.style.display = 'none');
    screen.style.display = 'flex';
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function showSuccess(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 3000);
}

function setLoading(form, isLoading) {
    const btn = form.querySelector('button[type="submit"]');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');

    btn.disabled = isLoading;
    btnText.style.display = isLoading ? 'none' : 'inline';
    btnLoader.style.display = isLoading ? 'inline' : 'none';

    // Disable all inputs
    form.querySelectorAll('input, select').forEach(input => {
        input.disabled = isLoading;
    });
}

// ===== DATA LOADING =====
async function loadUserData() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error('No user found');

        // Get user data from usuarios table
        const { data: userData, error: userError } = await supabaseClient
            .from('usuarios')
            .select('*, hogares(*)')
            .eq('auth_user_id', user.id)
            .single();

        if (userError) throw userError;
        if (!userData.hogar_id) throw new Error('Usuario sin hogar asignado');

        return userData;
    } catch (e) {
        console.error('Error loading user data:', e);
        throw e;
    }
}

async function loadAccounts(hogarId) {
    const { data, error } = await supabaseClient
        .from('cuentas')
        .select('*')
        .eq('hogar_id', hogarId)
        .eq('activa', true)
        .order('nombre');

    if (error) throw error;
    return data;
}

async function loadCategories(hogarId) {
    const { data, error } = await supabaseClient
        .from('categorias')
        .select('*')
        .eq('hogar_id', hogarId)
        .eq('tipo', 'gasto')
        .eq('activa', true)
        .order('nombre');

    if (error) throw error;
    return data;
}

function populateSelect(selectElement, items, valueKey = 'id', textKey = 'nombre') {
    // Clear existing options except the first one
    while (selectElement.options.length > 1) {
        selectElement.remove(1);
    }

    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[textKey];
        selectElement.appendChild(option);
    });

    // Restore last selected values
    const lastAccount = Storage.get('last_account');
    const lastCategory = Storage.get('last_category');

    if (selectElement.id === 'account' && lastAccount) {
        selectElement.value = lastAccount;
        // Trigger change event to check if it's a credit card
        checkAccountType(lastAccount);
    }
    if (selectElement.id === 'category' && lastCategory) {
        selectElement.value = lastCategory;
    }
}

// Check account type and show/hide imputation selector
async function checkAccountType(accountId) {
    if (!accountId) {
        imputacionSection.style.display = 'none';
        return;
    }

    try {
        const { data: account } = await supabaseClient
            .from('cuentas')
            .select('tipo')
            .eq('id', accountId)
            .single();

        if (account && account.tipo === 'tarjeta_credito') {
            imputacionSection.style.display = 'block';
            updateImputacionLabels();
        } else {
            imputacionSection.style.display = 'none';
        }
    } catch (e) {
        console.error('Error checking account type:', e);
    }
}

// ===== EXPENSE HELPERS =====
function calculateImputationMonth(fechaGasto, isCreditCard) {
    const date = new Date(fechaGasto);

    if (isCreditCard) {
        // For credit cards, impute to next month
        date.setMonth(date.getMonth() + 1);
    }

    return {
        month: date.getMonth() + 1,
        year: date.getFullYear()
    };
}

function isCreditCard(accountType) {
    return accountType === 'tarjeta_credito';
}

async function updateAccountBalance(accountId, amount, accountType) {
    // Get current balance
    const { data: account, error: fetchError } = await supabaseClient
        .from('cuentas')
        .select('saldo_actual')
        .eq('id', accountId)
        .single();

    if (fetchError) throw fetchError;

    const currentBalance = account.saldo_actual || 0;
    const newBalance = isCreditCard(accountType)
        ? currentBalance + amount
        : currentBalance - amount;

    // Update balance
    const { error: updateError } = await supabaseClient
        .from('cuentas')
        .update({ saldo_actual: newBalance })
        .eq('id', accountId);

    if (updateError) throw updateError;
}

async function createExpense(expenseData) {
    const { error } = await supabaseClient
        .from('gastos')
        .insert([expenseData]);

    if (error) throw error;
}

// ===== EVENT HANDLERS =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(loginForm, true);
    loginError.style.display = 'none';

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        if (rememberMe) {
            Storage.set('user_email', btoa(email));
            Storage.set('user_password', btoa(password));
        }

        await initApp();
    } catch (e) {
        showError(loginError, e.message || 'Error al iniciar sesión');
    } finally {
        setLoading(loginForm, false);
    }
});

expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoading(expenseForm, true);
    expenseError.style.display = 'none';
    expenseSuccess.style.display = 'none';

    const amount = parseFloat(document.getElementById('amount').value);
    const description = document.getElementById('description').value.trim();
    const accountId = document.getElementById('account').value;
    const categoryId = document.getElementById('category').value;

    try {
        const userData = await loadUserData();
        const { data: { user } } = await supabaseClient.auth.getUser();

        // Get account type
        const { data: account } = await supabaseClient
            .from('cuentas')
            .select('tipo')
            .eq('id', accountId)
            .single();

        const today = new Date().toISOString().split('T')[0];
        const imputation = calculateImputationFromSelector(today, isCreditCard(account.tipo));

        const expenseData = {
            hogar_id: userData.hogar_id,
            usuario_id: userData.id,
            cuenta_id: accountId,
            categoria_id: categoryId,
            descripcion: description,
            monto: amount,
            fecha_gasto: today,
            mes_imputacion: imputation.month,
            anio_imputacion: imputation.year,
            es_cuota: false
        };

        await createExpense(expenseData);
        await updateAccountBalance(accountId, amount, account.tipo);

        // Save last selections
        Storage.set('last_account', accountId);
        Storage.set('last_category', categoryId);

        showSuccess(expenseSuccess, '✅ Gasto guardado exitosamente');

        // Reset form
        expenseForm.reset();

        // Restore last selections
        document.getElementById('account').value = accountId;
        document.getElementById('category').value = categoryId;

        // Focus on amount for next entry
        document.getElementById('amount').focus();

    } catch (e) {
        console.error('Error creating expense:', e);
        showError(expenseError, e.message || 'Error al guardar el gasto');
    } finally {
        setLoading(expenseForm, false);
    }
});

// ===== IMPUTATION SELECTOR LOGIC =====
const accountSelect = document.getElementById('account');
const imputacionSection = document.getElementById('imputacionSection');
const manualImputacion = document.getElementById('manualImputacion');
const imputacionRadios = document.querySelectorAll('input[name="imputacion"]');

// Show/hide imputation selector based on account type
accountSelect.addEventListener('change', function () {
    checkAccountType(this.value);
});

// Update labels with calculated dates
function updateImputacionLabels() {
    const today = new Date();
    const mesSiguiente = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const dosMeses = new Date(today.getFullYear(), today.getMonth() + 2, 1);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    document.getElementById('labelSiguiente').textContent =
        `Mes siguiente (${meses[mesSiguiente.getMonth()]} ${mesSiguiente.getFullYear()})`;
    document.getElementById('labelDosMeses').textContent =
        `Dentro de 2 meses (${meses[dosMeses.getMonth()]} ${dosMeses.getFullYear()})`;

    // Set default values for manual selection
    const mesManual = document.getElementById('mesManual');
    const anioManual = document.getElementById('anioManual');
    mesManual.value = mesSiguiente.getMonth() + 1;
    anioManual.value = mesSiguiente.getFullYear();
}

// Show/hide manual selection
imputacionRadios.forEach(radio => {
    radio.addEventListener('change', function () {
        if (this.value === 'manual') {
            manualImputacion.style.display = 'block';
        } else {
            manualImputacion.style.display = 'none';
        }
    });
});

// Calculate imputation month based on selection
function calculateImputationFromSelector(fechaGasto, isCreditCard) {
    if (!isCreditCard) {
        const date = new Date(fechaGasto);
        return {
            month: date.getMonth() + 1,
            year: date.getFullYear()
        };
    }

    const selectedOption = document.querySelector('input[name="imputacion"]:checked').value;
    const date = new Date(fechaGasto);

    if (selectedOption === 'siguiente') {
        date.setMonth(date.getMonth() + 1);
        return {
            month: date.getMonth() + 1,
            year: date.getFullYear()
        };
    } else if (selectedOption === 'dos_meses') {
        date.setMonth(date.getMonth() + 2);
        return {
            month: date.getMonth() + 1,
            year: date.getFullYear()
        };
    } else { // manual
        return {
            month: parseInt(document.getElementById('mesManual').value),
            year: parseInt(document.getElementById('anioManual').value)
        };
    }
}

logoutBtn.addEventListener('click', async () => {
    if (confirm('¿Cerrar sesión?')) {
        await supabaseClient.auth.signOut();
        Storage.remove('user_email');
        Storage.remove('user_password');
        showScreen(loginScreen);
    }
});

// ===== APP INITIALIZATION =====
async function initApp() {
    try {
        showScreen(loadingScreen);

        const userData = await loadUserData();
        const [accounts, categories] = await Promise.all([
            loadAccounts(userData.hogar_id),
            loadCategories(userData.hogar_id)
        ]);

        populateSelect(document.getElementById('account'), accounts);
        populateSelect(document.getElementById('category'), categories);

        showScreen(appScreen);

        // Focus on amount input
        document.getElementById('amount').focus();

    } catch (e) {
        console.error('Error initializing app:', e);
        alert('Error al cargar la aplicación: ' + e.message);
        showScreen(loginScreen);
    }
}

// ===== STARTUP =====
(async () => {
    try {
        showScreen(loadingScreen);

        // Try auto-login first
        const session = await autoLogin();

        if (session) {
            await initApp();
        } else {
            // Check if there's an active session
            const currentSession = await checkAuth();
            if (currentSession) {
                await initApp();
            } else {
                showScreen(loginScreen);
            }
        }
    } catch (e) {
        console.error('Startup error:', e);
        showScreen(loginScreen);
    }
})();

// ===== PWA INSTALLATION =====
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // You can show a custom install button here if desired
    console.log('PWA install prompt available');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    deferredPrompt = null;
});
