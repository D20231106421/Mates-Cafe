import React, { useEffect, useState } from 'react';
import {
    AlertCircle,
    ArrowDown,
    ArrowUp,
    Building,
    CheckCircle2,
    ChevronRight,
    Clock,
    Coffee,
    CreditCard,
    Edit,
    Eye,
    EyeOff,
    Heart,
    Leaf,
    Lock,
    LogOut,
    Mail,
    PieChart,
    Plus,
    ShoppingCart,
    Store,
    Trash2,
    Users,
    Utensils,
    Wallet,
    X,
    Zap,
} from 'lucide-react';

const MENU_CATEGORIES = ['Coffee', 'Non-Coffee', 'Fizz', 'Food', 'Dessert'];
const DEFAULT_MENU_FORM = { id: null, name: '', category: 'Coffee', basePrice: '', description: '', imageUrl: '' };
const DEFAULT_CUSTOMER_ACCOUNTS = [
    { name: 'Customer', email: 'customer@mates.com', password: '123456' },
];
const ADMIN_ACCOUNT = { email: 'admin@mates.com', password: '123456' };

const getApiUrl = (path) => {
    const pathname = window.location.pathname;
    const indexPath = pathname.indexOf('/index.php');

    if (indexPath !== -1) {
        return `${pathname.slice(0, indexPath)}/index.php/api/mates-cafe${path}`;
    }

    const firstSegment = pathname.split('/').filter(Boolean)[0];

    if (firstSegment && firstSegment.toLowerCase() === 'mates-cafe') {
        return `/${firstSegment}/api.php?_path=${encodeURIComponent(path)}`;
    }

    return `/api/mates-cafe${path}`;
};

const apiRequest = async (path, options = {}) => {
    const response = await fetch(getApiUrl(path), {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

const IconForItem = ({ type, size = 48 }) => {
    const props = { size, strokeWidth: 1.5 };
    if (type === 'leaf') return <Leaf {...props} />;
    if (type === 'heart') return <Heart {...props} />;
    if (type === 'food') return <Utensils {...props} />;
    return <Coffee {...props} />;
};

const MenuItemVisual = ({ item, iconSize = 48, imageClassName = '', fallbackClassName = '' }) => {
    if (item.imageUrl) {
        return <img src={item.imageUrl} alt={item.name} className={`h-full w-full object-cover ${imageClassName}`} />;
    }

    return <div className={`flex h-full w-full items-center justify-center ${fallbackClassName}`}><IconForItem type={item.iconType} size={iconSize} /></div>;
};

export default function App() {
    const [currentRole, setCurrentRole] = useState('customer');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authPage, setAuthPage] = useState('customer-login');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerError, setRegisterError] = useState('');
    const [customerAccounts, setCustomerAccounts] = useState([]);
    const [currentCustomer, setCurrentCustomer] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('matesCafeCurrentCustomer'));
        } catch {
            return null;
        }
    });
    const [currentView, setCurrentView] = useState('home');
    const [profileFormData, setProfileFormData] = useState({ name: '', email: '', password: '' });
    const [profileError, setProfileError] = useState('');
    const [profileMessage, setProfileMessage] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [adminTab, setAdminTab] = useState('dashboard');
    const [adminMenuCategory, setAdminMenuCategory] = useState('All');
    const [salesViewMode, setSalesViewMode] = useState('daily');
    const [selectedPeriodFilter, setSelectedPeriodFilter] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [activeMenuCategory, setActiveMenuCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    const [currentOrderId, setCurrentOrderId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('fpx');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [delayModalOrder, setDelayModalOrder] = useState(null);
    const [delayInput, setDelayInput] = useState('');
    const [cancelModalOrder, setCancelModalOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [menuFormData, setMenuFormData] = useState(DEFAULT_MENU_FORM);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [staffFormData, setStaffFormData] = useState({ id: null, name: '', email: '', password: '', role: 'Barista' });
    const [staffMembers, setStaffMembers] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockFormData, setStockFormData] = useState({ id: null, name: '', quantity: 0, unit: 'pcs', lowStockAlert: 10 });
    const [customizingItem, setCustomizingItem] = useState(null);
    const [customOptions, setCustomOptions] = useState({
        size: 'Regular',
        sugar: 'Normal',
        ice: 'Normal',
        milk: 'Whole Milk',
        shots: 'Single',
        topping: 'None',
        note: '',
    });

    const isDrink = (category) => ['Coffee', 'Non-Coffee', 'Fizz'].includes(category);
    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

    useEffect(() => {
        let isMounted = true;
        const customerEmail = currentRole === 'customer' && currentCustomer?.email ? currentCustomer.email : '';
        const path = customerEmail ? `/bootstrap?customerEmail=${encodeURIComponent(customerEmail)}` : '/bootstrap';

        apiRequest(path)
            .then((data) => {
                if (!isMounted) return;
                setMenuItems(data.menuItems);
                setOrders(data.orders);
                setStaffMembers(data.staffMembers);
                setCustomerAccounts(data.customers);
                setStockItems(data.stockItems);
            })
            .catch((error) => {
                console.error(error);
            });

        return () => {
            isMounted = false;
        };
    }, [currentRole, currentCustomer]);


    useEffect(() => {
        if (currentCustomer) {
            localStorage.setItem('matesCafeCurrentCustomer', JSON.stringify(currentCustomer));
        } else {
            localStorage.removeItem('matesCafeCurrentCustomer');
        }
    }, [currentCustomer]);

    useEffect(() => {
        if (currentCustomer) {
            setProfileFormData({
                name: currentCustomer.name || '',
                email: currentCustomer.email || '',
                password: currentCustomer.password || '',
            });
        }
    }, [currentCustomer]);

    const completeLogin = (role, account = null) => {
        setCurrentRole(role);
        setCurrentView('home');
        setAdminTab('dashboard');
        setIsLoggedIn(true);
        setCurrentCustomer(account);
    };

    const resetAuthMessages = () => {
        setLoginError('');
        setRegisterError('');
    };

    const openAuthPage = (page) => {
        resetAuthMessages();
        setLoginEmail('');
        setLoginPassword('');
        setRegisterName('');
        setRegisterEmail('');
        setRegisterPassword('');
        setAuthPage(page);
    };

    const handleCustomerLogin = (event) => {
        event.preventDefault();
        setLoginError('');

        const account = customerAccounts.find((customer) => customer.email.toLowerCase() === loginEmail.toLowerCase());
        if (!account || account.password !== loginPassword) {
            setLoginError('Invalid customer email or password.');
            return;
        }

        completeLogin('customer', account);
    };

    const handleStaffLogin = (event, expectedRole) => {
        event.preventDefault();
        setLoginError('');

        const account = expectedRole === 'admin'
            ? ADMIN_ACCOUNT
            : staffMembers.find((staff) => staff.email?.toLowerCase() === loginEmail.toLowerCase());

        if (!account || account.email?.toLowerCase() !== loginEmail.toLowerCase() || account.password !== loginPassword) {
            setLoginError(`Invalid ${expectedRole} email or password.`);
            return;
        }

        completeLogin(expectedRole);
    };

    const handleCustomerRegister = async (event) => {
        event.preventDefault();
        setRegisterError('');

        if (customerAccounts.some((customer) => customer.email.toLowerCase() === registerEmail.toLowerCase())) {
            setRegisterError('This email is already registered.');
            return;
        }

        try {
            const newAccount = await apiRequest('/customers', {
                method: 'POST',
                body: JSON.stringify({
                    name: registerName.trim() || 'Customer',
                    email: registerEmail.trim(),
                    password: registerPassword,
                }),
            });
            setCustomerAccounts([...customerAccounts, newAccount]);
            setLoginEmail(newAccount.email);
            setLoginPassword(newAccount.password);
            setRegisterName('');
            setRegisterEmail('');
            setRegisterPassword('');
            setAuthPage('customer-login');
        } catch (error) {
            console.error(error);
            setRegisterError('Failed to register account. Please try again.');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentRole('customer');
        setCurrentView('home');
        setLoginEmail('');
        setLoginPassword('');
        setAuthPage('select');
        setProfileError('');
        setProfileMessage('');
        setCurrentCustomer(null);
        localStorage.removeItem('matesCafeCurrentCustomer');
    };

    const handleProfileSave = async (event) => {
        event.preventDefault();
        setProfileError('');
        setProfileMessage('');
        setIsSavingProfile(true);

        const oldEmail = currentCustomer?.email?.trim() || '';
        const nextName = profileFormData.name.trim();
        const nextEmail = profileFormData.email.trim();
        const nextPassword = profileFormData.password;

        if (!nextName || !nextEmail || !nextPassword) {
            setProfileError('Please fill in name, email, and password.');
            setIsSavingProfile(false);
            return;
        }

        if (customerAccounts.some((customer) => customer.email.toLowerCase() === nextEmail.toLowerCase() && customer.email.toLowerCase() !== oldEmail.toLowerCase())) {
            setProfileError('That email is already used by another customer.');
            setIsSavingProfile(false);
            return;
        }

        try {
            if (oldEmail && oldEmail.toLowerCase() !== nextEmail.toLowerCase()) {
                await apiRequest('/orders/customer-email', {
                    method: 'PATCH',
                    body: JSON.stringify({ oldEmail, newEmail: nextEmail }),
                });
            }

            const savedCustomer = await apiRequest(`/customers/${currentCustomer.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: nextName,
                    email: nextEmail,
                    password: nextPassword,
                }),
            });

            setCustomerAccounts(
                customerAccounts.map((customer) => (
                    customer.id === currentCustomer.id ? savedCustomer : customer
                )),
            );
            setCurrentCustomer(savedCustomer);
            setLoginEmail(nextEmail);
            setLoginPassword(nextPassword);
            setProfileMessage('Profile updated successfully.');
        } catch (error) {
            console.error(error);
            setProfileError('We could not update your profile right now. Please try again.');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!currentCustomer) return;
        if (!window.confirm('Delete this customer account?')) return;

        setIsDeletingAccount(true);
        try {
            await apiRequest(`/customers/${currentCustomer.id}`, { method: 'DELETE' });

            const emailToDelete = currentCustomer.email.toLowerCase();
            setCustomerAccounts(customerAccounts.filter((customer) => customer.email.toLowerCase() !== emailToDelete));
            setCurrentCustomer(null);
            setIsLoggedIn(false);
            setCurrentRole('customer');
            setCurrentView('home');
            setAuthPage('select');
            setLoginEmail('');
            setLoginPassword('');
            setProfileError('');
            setProfileMessage('');
            setProfileFormData({ name: '', email: '', password: '' });
            localStorage.removeItem('matesCafeCurrentCustomer');
        } catch (error) {
            console.error(error);
            alert('Failed to delete account. Please try again.');
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const openCustomization = (item) => {
        setCustomizingItem(item);
        setCustomOptions({
            size: 'Regular',
            sugar: 'Normal',
            ice: 'Normal',
            milk: 'Whole Milk',
            shots: 'Single',
            topping: 'None',
            note: '',
        });
    };

    const getCustomizedPrice = () => {
        if (!customizingItem) return 0;
        let price = customizingItem.basePrice;
        if (isDrink(customizingItem.category)) {
            if (customOptions.size === 'Large') price += 2;
            if (['Coffee', 'Non-Coffee'].includes(customizingItem.category) && ['Oat Milk', 'Almond Milk'].includes(customOptions.milk)) price += 2;
            if (customizingItem.category === 'Coffee' && customOptions.shots === 'Double') price += 1.5;
            if (customizingItem.category === 'Coffee' && customOptions.shots === 'Triple') price += 3;
            if (customOptions.topping !== 'None') price += 1;
        }
        return price;
    };

    const confirmAddToCart = () => {
        const details = [];
        if (isDrink(customizingItem.category)) {
            details.push(customOptions.size, `${customOptions.sugar} Sugar`, `${customOptions.ice} Ice`);
            if (['Coffee', 'Non-Coffee'].includes(customizingItem.category)) details.push(customOptions.milk);
            if (customizingItem.category === 'Coffee') details.push(`${customOptions.shots} Shot(s)`);
            if (customOptions.topping !== 'None') details.push(`+ ${customOptions.topping}`);
        } else {
            details.push('Standard Preparation');
            if (customOptions.note.trim()) details.push(`Note: ${customOptions.note.trim()}`);
        }

        setCart([...cart, { ...customizingItem, price: getCustomizedPrice(), details: details.join(', ') }]);
        setCustomizingItem(null);
    };

    const placeOrder = async (event) => {
        event.preventDefault();
        setCheckoutError('');
        setIsPlacingOrder(true);

        const formData = new FormData(event.target);
        const now = new Date();
        const submittedCustomerEmail = formData.get('customerEmail');
        const orderPayload = {
            items: [...cart],
            total: cartTotal,
            payment: paymentMethod,
            status: 'Pending',
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            customer: currentCustomer?.name || 'Ahmad Ali',
            customerEmail: (submittedCustomerEmail || currentCustomer?.email || '').trim() || null,
            customerPhone: formData.get('customerPhone') || null,
        };

        try {
            const newOrder = await apiRequest('/orders', {
                method: 'POST',
                body: JSON.stringify(orderPayload),
            });

            setOrders([newOrder, ...orders]);
            setCurrentOrderId(newOrder.id);
            setCart([]);
            setCurrentView('tracking');
        } catch (error) {
            console.error(error);
            setCheckoutError('We could not place your order. Please check your connection and try again.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    const updateOrderStatus = async (id, status) => {
        const updatedOrder = await apiRequest(`/orders/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });

        setOrders(orders.map((order) => (order.id === id ? updatedOrder : order)));
    };

    const handleCancelSubmit = async () => {
        if (!cancelModalOrder || !cancelReason.trim()) return;
        const updatedOrder = await apiRequest(`/orders/${encodeURIComponent(cancelModalOrder.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'Canceled', cancelReason }),
        });

        setOrders(orders.map((order) => (order.id === cancelModalOrder.id ? updatedOrder : order)));
        setCancelModalOrder(null);
        setCancelReason('');
    };

    const handleDelaySubmit = async () => {
        if (!delayModalOrder || !delayInput) return;
        const updatedOrder = await apiRequest(`/orders/${encodeURIComponent(delayModalOrder.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ delay: delayInput }),
        });

        setOrders(orders.map((order) => (order.id === delayModalOrder.id ? updatedOrder : order)));
        setDelayModalOrder(null);
        setDelayInput('');
    };

    const clearOrderDelay = async (id) => {
        const updatedOrder = await apiRequest(`/orders/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ delay: null }),
        });

        setOrders(orders.map((order) => (order.id === id ? updatedOrder : order)));
    };

    const deleteMenuItem = async (id) => {
        await apiRequest(`/menu-items/${id}`, { method: 'DELETE' });
        setMenuItems(menuItems.filter((item) => item.id !== id));
    };

    const toggleMenuAvailability = async (item) => {
        const updatedItem = await apiRequest(`/menu-items/${item.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: item.name,
                category: item.category,
                basePrice: item.basePrice,
                description: item.description,
                iconType: item.iconType,
                imageUrl: item.imageUrl || null,
                isAvailable: !item.isAvailable,
            }),
        });
        setMenuItems(menuItems.map((m) => (m.id === item.id ? updatedItem : m)));
    };

    const moveMenuItem = async (index, direction) => {
        const filtered = adminMenuCategory === 'All' ? [...menuItems] : menuItems.filter((item) => item.category === adminMenuCategory);
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= filtered.length) return;

        const newFiltered = [...filtered];
        [newFiltered[index], newFiltered[targetIndex]] = [newFiltered[targetIndex], newFiltered[index]];

        // Build the full reordered list
        let reorderedAll;
        if (adminMenuCategory === 'All') {
            reorderedAll = newFiltered;
        } else {
            // Replace only the items in this category, keeping others in place
            const otherItems = menuItems.filter((item) => item.category !== adminMenuCategory);
            reorderedAll = [...otherItems];
            // Insert filtered items at their original category positions
            // Simple approach: concat and let backend handle sort_order
            reorderedAll = [...newFiltered, ...otherItems];
        }

        const ids = reorderedAll.map((item) => item.id);
        const updatedItems = await apiRequest('/menu-items/reorder', {
            method: 'POST',
            body: JSON.stringify({ ids }),
        });
        setMenuItems(updatedItems);
    };

    const deleteStaffMember = async (id) => {
        await apiRequest(`/staff-members/${id}`, { method: 'DELETE' });
        setStaffMembers(staffMembers.filter((staff) => staff.id !== id));
    };

    const deleteStockItem = async (id) => {
        await apiRequest(`/stock-items/${id}`, { method: 'DELETE' });
        setStockItems(stockItems.filter((item) => item.id !== id));
    };

    const updateMenuImage = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setMenuFormData((current) => ({ ...current, imageUrl: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const saveMenuItem = async (event) => {
        event.preventDefault();
        const price = parseFloat(menuFormData.basePrice);
        if (Number.isNaN(price)) return;
        const payload = {
            name: menuFormData.name,
            category: menuFormData.category,
            basePrice: price,
            description: menuFormData.description,
            iconType: menuFormData.iconType || (isDrink(menuFormData.category) ? 'coffee' : 'food'),
            imageUrl: menuFormData.imageUrl || null,
        };

        if (menuFormData.id) {
            const updatedItem = await apiRequest(`/menu-items/${menuFormData.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });
            setMenuItems(menuItems.map((item) => (item.id === menuFormData.id ? updatedItem : item)));
        } else {
            const newItem = await apiRequest('/menu-items', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setMenuItems([...menuItems, newItem]);
        }
        setIsMenuModalOpen(false);
    };

    const saveStaff = async (event) => {
        event.preventDefault();
        if (staffFormData.id) {
            const updatedStaff = await apiRequest(`/staff-members/${staffFormData.id}`, {
                method: 'PUT',
                body: JSON.stringify({ name: staffFormData.name, email: staffFormData.email, password: staffFormData.password, role: staffFormData.role }),
            });
            setStaffMembers(staffMembers.map((staff) => (staff.id === staffFormData.id ? updatedStaff : staff)));
        } else {
            const newStaff = await apiRequest('/staff-members', {
                method: 'POST',
                body: JSON.stringify({ name: staffFormData.name, email: staffFormData.email, password: staffFormData.password, role: staffFormData.role }),
            });
            setStaffMembers([...staffMembers, newStaff]);
        }
        setIsStaffModalOpen(false);
    };

    const saveStock = async (event) => {
        event.preventDefault();
        const item = {
            ...stockFormData,
            quantity: parseInt(stockFormData.quantity, 10) || 0,
            lowStockAlert: parseInt(stockFormData.lowStockAlert, 10) || 0,
        };

        if (stockFormData.id) {
            const updatedItem = await apiRequest(`/stock-items/${stockFormData.id}`, {
                method: 'PUT',
                body: JSON.stringify(item),
            });
            setStockItems(stockItems.map((stock) => (stock.id === stockFormData.id ? updatedItem : stock)));
        } else {
            const newItem = await apiRequest('/stock-items', {
                method: 'POST',
                body: JSON.stringify(item),
            });
            setStockItems([...stockItems, newItem]);
        }
        setIsStockModalOpen(false);
    };

    const renderNavbar = () => (
        <div className="sticky top-4 z-50 mx-auto max-w-6xl px-4">
            <nav className="rounded-full border border-slate-200/60 bg-white/80 shadow-lg shadow-slate-200/50 backdrop-blur-xl">
                <div className="flex flex-col items-center justify-between gap-4 px-6 py-3 sm:flex-row">
                    <button className="group flex items-center gap-3" onClick={() => currentRole === 'customer' && setCurrentView('home')}>
                        <span className="rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 p-2.5 text-white shadow-md transition-transform group-hover:scale-105">
                            <Coffee size={22} strokeWidth={2.5} />
                        </span>
                        <span className="text-2xl font-extrabold tracking-tight text-slate-900">Mates<span className="text-sky-500">Cafe</span></span>
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <div className="flex items-center gap-3 border-r border-slate-200 pr-4">
                            <div className="text-right">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Logged in as</div>
                                <div className="text-sm font-extrabold capitalize text-slate-800">{currentRole}</div>
                            </div>
                            <button onClick={handleLogout} className="rounded-xl bg-slate-50 p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Logout">
                                <LogOut size={18} />
                            </button>
                        </div>
                        {currentRole === 'customer' && (
                            <div className="flex items-center gap-2">
                                <NavButton icon={<Utensils size={18} />} label="Menu" onClick={() => setCurrentView('menu')} />
                                <NavButton icon={<Clock size={18} />} label="Orders" onClick={() => setCurrentView('order-history')} />
                                <NavButton icon={<Edit size={18} />} label="Profile" onClick={() => setCurrentView('profile')} />
                                <button onClick={() => setCurrentView('cart')} className="relative flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-600">
                                    <ShoppingCart size={18} /> <span className="hidden sm:inline">Cart</span>
                                    {cart.length > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-sky-500 text-[10px] font-bold text-white">{cart.length}</span>}
                                </button>
                            </div>
                        )}
                        {currentRole === 'staff' && (
                            <div className="flex items-center gap-2">
                                <NavButton icon={<Clock size={18} />} label="Active Orders" onClick={() => document.getElementById('staff-active-orders')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
                                <NavButton icon={<Building size={18} />} label="Stock Inventory" onClick={() => document.getElementById('staff-stock-inventory')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );

    const renderHome = () => (
        <div>
            <section className="relative overflow-hidden bg-slate-50 px-4 py-24 sm:py-32">
                <div className="mx-auto max-w-6xl">
                    <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
                        <div className="text-center lg:text-left">
                            <h1 className="mb-8 text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-7xl">
                                Mates Cafe.<br />
                                <span className="relative inline-block">
                                    <span className="relative z-10 bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Zero Wait Time.</span>
                                    <span className="absolute bottom-2 left-0 -z-10 h-6 w-full -rotate-2 rounded-full bg-sky-100 opacity-50"></span>
                                </span>
                            </h1>
                            <p className="mb-10 text-lg leading-relaxed text-slate-500 sm:text-xl">Your favorite local spot in Tanjong Malim. Order ahead online and pick up your freshly prepared food and drinks without the queue.</p>
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                                <button onClick={() => setCurrentView('menu')} className="flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-lg font-bold text-white shadow-xl transition hover:-translate-y-1 hover:bg-sky-600 hover:shadow-sky-500/25 sm:w-auto">
                                    Order Now <ChevronRight size={20} />
                                </button>
                                <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-transparent px-8 py-4 text-lg font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto">
                                    Learn More
                                </button>
                            </div>
                        </div>
                        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                            <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-sky-100 to-blue-50 opacity-50 blur-2xl"></div>
                            <div className="relative aspect-square overflow-hidden rounded-[3rem] bg-white shadow-2xl shadow-slate-200/50">
                                <img src="/images/hero-coffee.png" alt="Artisan Coffee" className="absolute inset-0 h-full w-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
                            </div>
                            <div className="absolute -bottom-6 -left-6 flex animate-float items-center gap-4 rounded-2xl bg-white p-5 shadow-xl shadow-slate-200/50">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={24} /></div>
                                <div><div className="text-sm font-bold text-slate-500">Status</div><div className="font-extrabold text-slate-900">Always Fresh</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-24 md:grid-cols-3">
                <Feature icon={<Coffee size={28} />} title="Premium Quality" text="We source the finest ingredients and roast our beans to perfection for that perfect cup." color="amber" />
                <Feature icon={<Zap size={28} />} title="Fast Preparation" text="Order ahead. We'll have your food and drinks ready by the time you arrive at the cafe." color="sky" />
                <Feature icon={<Store size={28} />} title="Easy Pick-up" text="Skip the queue entirely. Walk in, grab your order, and you're good to go." color="emerald" />
            </section>
        </div>
    );

    const renderMenu = () => {
        const displayCategories = activeMenuCategory === 'All' ? MENU_CATEGORIES : [activeMenuCategory];

        return (
            <div className="mx-auto max-w-6xl px-4 py-20">
                <PageTitle title="Our Menu" subtitle="Carefully crafted food and beverages." />
                <CategoryTabs value={activeMenuCategory} onChange={setActiveMenuCategory} categories={MENU_CATEGORIES} allLabel="All Items" />
                {displayCategories.map((category) => {
                    const items = menuItems.filter((item) => item.category === category);
                    if (!items.length) return null;
                    return (
                        <section key={category} className="mb-20">
                            <h3 className="mb-8 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">{category}<span className="ml-4 h-px flex-1 bg-slate-200" /></h3>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {items.map((item) => (
                                    <div key={item.id} className={`group relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-slate-100/50 bg-white shadow-sm transition-all duration-300 ${item.isAvailable !== false ? 'hover:-translate-y-1.5 hover:shadow-xl hover:shadow-sky-100/50' : 'opacity-90'}`}>
                                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 text-slate-300">
                                            <MenuItemVisual item={item} fallbackClassName={`transition ${item.isAvailable !== false ? 'group-hover:text-sky-500' : 'opacity-40'}`} imageClassName={`transition duration-500 ${item.isAvailable !== false ? 'group-hover:scale-105' : 'grayscale opacity-50'}`} />
                                            {item.isAvailable === false && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60">
                                                    <span className="rounded-full bg-slate-900/80 px-5 py-2.5 text-sm font-extrabold uppercase tracking-widest text-white shadow-lg backdrop-blur-sm">Unavailable</span>
                                                </div>
                                            )}
                                            <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold tracking-wider text-slate-900 shadow-sm backdrop-blur-md">RM {item.basePrice.toFixed(2)}</div>
                                        </div>
                                        <div className="flex flex-grow flex-col p-6">
                                            <h3 className={`mb-2 text-xl font-extrabold leading-tight ${item.isAvailable !== false ? 'text-slate-900' : 'text-slate-400'}`}>{item.name}</h3>
                                            <p className={`mb-6 line-clamp-2 flex-grow text-sm leading-relaxed ${item.isAvailable !== false ? 'text-slate-500' : 'text-slate-400'}`}>{item.description}</p>
                                            {item.isAvailable !== false ? (
                                                <button onClick={() => openCustomization(item)} className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-3.5 text-sm font-bold text-slate-700 transition duration-300 group-hover:bg-slate-900 group-hover:text-white group-hover:shadow-md">
                                                    <Plus size={18} strokeWidth={2.5} /> Add to Order
                                                </button>
                                            ) : (
                                                <div className="mt-auto flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-400">
                                                    <EyeOff size={18} strokeWidth={2.5} /> Currently Unavailable
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })}
                {customizingItem && renderCustomizationModal()}
            </div>
        );
    };

    const renderCustomizationModal = () => (
        <Modal title="Customize Item" onClose={() => setCustomizingItem(null)}>
            <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-50 text-sky-500"><MenuItemVisual item={customizingItem} /></div>
                    <div>
                        <h4 className="font-bold text-slate-900">{customizingItem.name}</h4>
                        <p className="mt-0.5 text-sm font-bold text-sky-600">Base: RM {customizingItem.basePrice.toFixed(2)}</p>
                    </div>
                </div>

                {isDrink(customizingItem.category) ? (
                    <div className="space-y-6">
                        <OptionGroup label="Cup Size" options={[['Regular', 'Regular'], ['Large (+RM 2.00)', 'Large']]} value={customOptions.size} name="size" cols="grid-cols-2" setCustomOptions={setCustomOptions} />
                        {['Coffee', 'Non-Coffee'].includes(customizingItem.category) && (
                            <OptionGroup label="Milk Type" options={[['Whole Milk', 'Whole Milk'], ['Skim Milk', 'Skim Milk'], ['Oat Milk (+RM 2)', 'Oat Milk'], ['Almond Milk (+RM 2)', 'Almond Milk']]} value={customOptions.milk} name="milk" cols="grid-cols-2" setCustomOptions={setCustomOptions} />
                        )}
                        {customizingItem.category === 'Coffee' && (
                            <OptionGroup label="Espresso Shots" options={[['Single', 'Single'], ['Double', 'Double'], ['Triple', 'Triple']]} value={customOptions.shots} name="shots" cols="grid-cols-3" setCustomOptions={setCustomOptions} />
                        )}
                        <div className="grid grid-cols-2 gap-6">
                            <OptionGroup label="Sugar" options={['Normal', 'Less', 'No'].map((x) => [x, x])} value={customOptions.sugar} name="sugar" cols="grid-cols-1" setCustomOptions={setCustomOptions} />
                            <OptionGroup label="Ice" options={['Normal', 'Less', 'No'].map((x) => [x, x])} value={customOptions.ice} name="ice" cols="grid-cols-1" setCustomOptions={setCustomOptions} />
                        </div>
                        <OptionGroup label="Topping (+RM 1.00)" options={['None', 'Caramel', 'Whip Cream', 'Choc Chips'].map((x) => [x, x])} value={customOptions.topping} name="topping" cols="grid-cols-2 sm:grid-cols-4" setCustomOptions={setCustomOptions} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="border-b border-slate-200 py-4 text-center text-slate-500">Standard preparation applies for food & desserts.</div>
                        <label className="block">
                            <span className="mb-3 block text-sm font-bold uppercase tracking-wider text-slate-800">Special Instructions</span>
                            <textarea value={customOptions.note} onChange={(event) => setCustomOptions({ ...customOptions, note: event.target.value })} className="w-full resize-none rounded-xl border-2 border-slate-200 p-4 outline-none transition focus:border-sky-500" rows="3" placeholder="e.g. No peanuts, extra spicy..." />
                        </label>
                    </div>
                )}
            </div>
            <button onClick={confirmAddToCart} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-extrabold text-white transition hover:bg-sky-600">
                <Plus size={20} /> Add to Cart - RM {getCustomizedPrice().toFixed(2)}
            </button>
        </Modal>
    );

    const renderCart = () => (
        <div className="mx-auto max-w-3xl px-4 py-12">
            <h2 className="mb-8 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900"><ShoppingCart className="text-sky-500" size={32} /> Your Cart</h2>
            {cart.length === 0 ? (
                <EmptyState icon={<ShoppingCart size={32} />} title="Your cart is empty" text="Looks like you haven't added anything yet." action="Browse Menu" onAction={() => setCurrentView('menu')} />
            ) : (
                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                    <ul className="mb-8 divide-y divide-slate-100">
                        {cart.map((item, index) => (
                            <li key={`${item.id}-${index}`} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-sky-500"><MenuItemVisual item={item} iconSize={32} /></div>
                                    <div>
                                        <span className="mb-1 block text-lg font-extrabold text-slate-900">{item.name}</span>
                                        <span className="block max-w-md text-sm leading-relaxed text-slate-500">{item.details}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-4 sm:justify-end">
                                    <span className="text-xl font-extrabold text-slate-900">RM {item.price.toFixed(2)}</span>
                                    <button onClick={() => setCart(cart.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500" title="Remove item">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <div className="mb-8 rounded-2xl border border-slate-100 bg-slate-50 p-6">
                        <div className="flex items-center justify-between"><span className="font-bold text-slate-600">Subtotal</span><span className="text-2xl font-extrabold text-slate-900">RM {cartTotal.toFixed(2)}</span></div>
                    </div>
                    <button onClick={() => setCurrentView('checkout')} className="w-full rounded-2xl bg-slate-900 py-4 font-extrabold text-white transition hover:bg-sky-600">Proceed to Checkout</button>
                </div>
            )}
        </div>
    );

    const renderCheckout = () => (
        <div className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-8 text-3xl font-extrabold tracking-tight text-slate-900">Checkout</h2>
            <form onSubmit={placeOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-7">
                    {checkoutError && (
                        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                            {checkoutError}
                        </div>
                    )}
                    <input type="hidden" name="customerEmail" value={currentCustomer?.email || loginEmail || ''} />
                    <div className="flex items-start gap-4 rounded-2xl border-2 border-sky-100 bg-sky-50 p-5 text-sky-900">
                        <Store className="mt-0.5 shrink-0 text-sky-500" size={24} />
                        <div><h4 className="text-lg font-bold">Self Pick-up</h4><p className="mt-1 text-sm leading-relaxed text-sky-700/80">Collect your order directly from the Mates Cafe counter when your tracking status updates to Ready.</p></div>
                    </div>
                    <Panel title="Contact Details">
                        <Input label="Phone Number" name="customerPhone" placeholder="01X-XXXXXXX" type="tel" required />
                    </Panel>
                    <Panel title="Payment Method">
                        {[
                            { id: 'fpx', icon: <Building size={20} />, label: 'Online Banking (FPX)' },
                            { id: 'ewallet', icon: <Wallet size={20} />, label: 'E-Wallet (TNG, Boost)' },
                            { id: 'card', icon: <CreditCard size={20} />, label: 'Credit / Debit Card' },
                        ].map((method) => (
                            <label key={method.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition ${paymentMethod === method.id ? 'border-sky-500 bg-sky-50/50' : 'border-slate-100 hover:border-slate-200'}`}>
                                <input type="radio" value={method.id} checked={paymentMethod === method.id} onChange={(event) => setPaymentMethod(event.target.value)} className="h-5 w-5 text-sky-500" />
                                <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${paymentMethod === method.id ? 'bg-sky-100 text-sky-600' : 'bg-slate-50 text-slate-400'}`}>{method.icon}</span>
                                <span className="font-bold text-slate-800">{method.label}</span>
                            </label>
                        ))}
                    </Panel>
                </div>
                <aside className="lg:col-span-5">
                    <div className="sticky top-24 rounded-3xl bg-slate-900 p-6 text-white shadow-xl sm:p-8">
                        <h3 className="mb-6 border-b border-slate-700 pb-4 text-xl font-bold">Order Summary</h3>
                        <div className="custom-scrollbar mb-6 max-h-60 space-y-4 overflow-y-auto pr-2">
                            {cart.map((item, index) => (
                                <div key={`${item.id}-summary-${index}`} className="flex items-start justify-between gap-4">
                                    <div><span className="block text-sm font-bold text-slate-100">{item.name}</span><span className="line-clamp-1 text-xs text-slate-400">{item.details}</span></div>
                                    <span className="shrink-0 text-sm font-bold text-sky-400">RM {item.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 border-t border-slate-700 pt-6">
                            <div className="mb-8 flex items-end justify-between"><span className="font-bold text-slate-300">Total to Pay</span><span className="text-3xl font-extrabold">RM {cartTotal.toFixed(2)}</span></div>
                            <button type="submit" disabled={isPlacingOrder} className="w-full rounded-xl bg-sky-500 py-4 font-extrabold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70">
                                {isPlacingOrder ? 'Placing Order...' : 'Pay & Place Order'}
                            </button>
                        </div>
                    </div>
                </aside>
            </form>
        </div>
    );

    const customerOrders = orders;

    const renderOrderHistory = () => (
        <div className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-8 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900"><Clock className="text-sky-500" size={32} /> Order History</h2>
            <div className="space-y-6">
                {customerOrders.map((order) => (
                    <OrderCard key={order.id} order={order} onView={() => { setCurrentOrderId(order.id); setCurrentView('tracking'); }} />
                ))}
            </div>
        </div>
    );

    const renderTracking = () => {
        const activeOrder = customerOrders.find((order) => order.id === currentOrderId) || customerOrders[0];
        if (!activeOrder) return null;
        const statuses = ['Pending', 'Preparing', 'Ready', 'Completed'];
        const currentStepIndex = statuses.indexOf(activeOrder.status);

        return (
            <div className="mx-auto max-w-2xl px-4 py-12 text-center">
                <div className="mb-6 flex justify-start"><button onClick={() => setCurrentView('order-history')} className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 font-bold text-slate-500 shadow-sm transition hover:text-sky-600"><ChevronRight size={16} className="rotate-180" /> Back to Orders</button></div>
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-white shadow-xl shadow-sky-200"><CheckCircle2 size={48} strokeWidth={2.5} /></div>
                <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-slate-900">Order Received!</h2>
                <p className="mb-10 font-medium text-slate-500">Order ID: <span className="font-extrabold text-sky-600">{activeOrder.id}</span></p>

                {activeOrder.status === 'Canceled' ? (
                    <AlertPanel tone="red" title="Order Canceled" text={activeOrder.cancelReason || 'Your order has been canceled by the cafe.'} />
                ) : (
                    <>
                        {activeOrder.delay && <AlertPanel tone="orange" title="Order Delayed" text={`The cafe has noted a delay of ${activeOrder.delay}. We apologize for the wait!`} />}
                        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-left shadow-sm sm:p-10">
                            <h3 className="mb-8 text-xl font-extrabold tracking-tight text-slate-900">Live Tracking</h3>
                            <div className="relative space-y-8">
                                {statuses.map((status, index) => {
                                    const isCompleted = index <= currentStepIndex;
                                    const isCurrent = index === currentStepIndex;
                                    return (
                                        <div key={status} className="flex items-center gap-5">
                                            <div className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white ${isCompleted ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-100 text-slate-300'}`}>{isCompleted ? <CheckCircle2 size={20} /> : <Clock size={20} />}</div>
                                            <div className={`flex-1 rounded-2xl border p-5 ${isCurrent ? 'border-sky-100 bg-sky-50' : 'border-slate-100 bg-white'}`}>
                                                <div className={`mb-1 font-extrabold ${isCurrent ? 'text-sky-900' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>{status}</div>
                                                <div className={`text-sm font-medium ${isCurrent ? 'text-sky-700/80' : 'text-slate-500'}`}>{trackingText(status)}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    const renderStockRows = (showActions = false) => (
        stockItems.map((item) => {
            const isLowStock = item.quantity <= item.lowStockAlert;
            return (
                <tr key={item.id} className="group transition hover:bg-slate-50/50">
                    <td className="p-5 font-bold text-slate-900">{item.name}</td>
                    <td className="p-5">{isLowStock ? <Badge danger icon={<AlertCircle size={12} strokeWidth={3} />} text="Low Stock" /> : <Badge text="Adequate" />}</td>
                    <td className="p-5"><span className={`text-xl font-extrabold ${isLowStock ? 'text-red-600' : 'text-slate-900'}`}>{item.quantity}</span> <span className="ml-1 text-xs font-bold uppercase tracking-widest text-slate-400">{item.unit}</span></td>
                    {showActions && <td className="p-5"><RowActions onEdit={() => { setStockFormData(item); setIsStockModalOpen(true); }} onDelete={() => deleteStockItem(item.id)} /></td>}
                </tr>
            );
        })
    );

    const renderStaffView = () => (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <section id="staff-active-orders" className="scroll-mt-28">
                <div className="mb-8"><h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Active Orders</h2><p className="mt-2 font-medium text-slate-500">Manage and update incoming customer orders.</p></div>
                <DataTable headers={['Order ID', 'Customer', 'Items', 'Status Action']} minWidth="800px">
                    {orders.map((order) => (
                        <tr key={order.id} className="transition hover:bg-slate-50/50">
                            <td className="p-5 align-top"><div className="text-lg font-extrabold text-sky-600">{order.id}</div><div className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-400">{order.time}</div></td>
                            <td className="p-5 align-top font-bold text-slate-800">{order.customer}</td>
                            <td className="p-5 align-top"><ItemList items={order.items} /></td>
                            <td className="w-64 p-5 align-top">
                                {order.status === 'Canceled' ? (
                                    <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-red-700"><span className="mb-1 block text-sm font-extrabold tracking-wider">CANCELED</span><span className="text-xs font-medium">{order.cancelReason}</span></div>
                                ) : (
                                    <div className="space-y-2">
                                        <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)} className="w-full cursor-pointer rounded-xl border-2 border-slate-200 bg-white p-3 text-sm font-bold text-slate-700 outline-none">
                                            {['Pending', 'Preparing', 'Ready', 'Completed'].map((status) => <option key={status} value={status}>{status}</option>)}
                                        </select>
                                        {order.delay ? (
                                            <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 p-3"><span className="truncate text-xs font-extrabold text-orange-700">Delay: {order.delay}</span><button onClick={() => clearOrderDelay(order.id)} className="rounded-md bg-white p-1 text-orange-400 shadow-sm hover:text-orange-600"><X size={14} /></button></div>
                                        ) : (
                                            <button onClick={() => { setDelayModalOrder(order); setDelayInput(''); }} className="w-full rounded-xl border border-orange-100 bg-orange-50/50 py-2.5 text-xs font-bold text-orange-600 transition hover:bg-orange-50">+ Add Delay</button>
                                        )}
                                        <button onClick={() => { setCancelModalOrder(order); setCancelReason(''); }} className="w-full rounded-xl border border-red-100 bg-red-50/50 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50">Cancel Order</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    ))}
                </DataTable>
            </section>
            <section id="staff-stock-inventory" className="scroll-mt-28 mt-12">
                <div className="mb-8"><h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Stock Inventory</h2><p className="mt-2 font-medium text-slate-500">View current cafe supply levels.</p></div>
                <DataTable headers={['Supply Name', 'Status', 'Quantity']} minWidth="600px">
                    {renderStockRows()}
                </DataTable>
            </section>
            {delayModalOrder && renderDelayModal()}
            {cancelModalOrder && renderCancelModal()}
        </div>
    );

    const renderDelayModal = () => (
        <Modal title="Set Order Delay" onClose={() => setDelayModalOrder(null)} tone="orange">
            <p className="mb-4 text-sm font-medium text-slate-600">Select delay time for order <strong className="text-slate-900">{delayModalOrder.id}</strong>:</p>
            <select autoFocus value={delayInput} onChange={(event) => setDelayInput(event.target.value)} className="mb-6 w-full cursor-pointer rounded-xl border-2 border-slate-200 bg-white p-3.5 font-bold text-slate-800 outline-none focus:border-orange-500">
                <option value="" disabled>Select delay time...</option>
                {['5 minutes', '10 minutes', '15 minutes', '20 minutes', '30 minutes', '45 minutes', '1 hour'].map((delay) => <option key={delay} value={delay}>{delay}</option>)}
            </select>
            <button onClick={handleDelaySubmit} disabled={!delayInput} className="w-full rounded-xl bg-orange-500 py-3.5 font-extrabold text-white transition hover:bg-orange-600 disabled:bg-orange-300">Notify Customer</button>
        </Modal>
    );

    const renderCancelModal = () => (
        <Modal title="Cancel Order" onClose={() => setCancelModalOrder(null)} tone="red">
            <p className="mb-4 text-sm font-medium text-slate-600">Please provide a reason for canceling order <strong className="text-slate-900">{cancelModalOrder.id}</strong>.</p>
            <textarea autoFocus value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="e.g. Items out of stock..." rows="3" className="mb-6 w-full resize-none rounded-xl border-2 border-slate-200 p-4 font-medium text-slate-900 outline-none focus:border-red-500" />
            <button onClick={handleCancelSubmit} disabled={!cancelReason.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3.5 font-extrabold text-white transition hover:bg-red-600 disabled:bg-red-300"><AlertCircle size={18} /> Confirm Cancellation</button>
        </Modal>
    );

    const renderProfile = () => (
        <div className="mx-auto max-w-4xl px-4 py-12">
            <h2 className="mb-8 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900"><Edit className="text-sky-500" size={32} /> Profile</h2>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                <aside className="lg:col-span-4">
                    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
                        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                            <Users size={34} strokeWidth={2} />
                        </div>
                        <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">{currentCustomer?.name || 'Customer'}</h3>
                        <p className="mt-2 text-sm font-medium text-slate-500">{currentCustomer?.email}</p>
                        <p className="mt-6 text-sm leading-relaxed text-slate-500">Update your account details here. Changing your email will keep your past orders linked to the new address.</p>
                    </div>
                </aside>
                <div className="lg:col-span-8">
                    <Panel title="Edit Account">
                        <form onSubmit={handleProfileSave} className="space-y-6">
                            {profileError && <AuthError text={profileError} />}
                            {profileMessage && <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{profileMessage}</div>}
                            <Input label="Name" value={profileFormData.name} onChange={(event) => setProfileFormData({ ...profileFormData, name: event.target.value })} placeholder="Enter your name" required />
                            <Input label="Email" type="email" value={profileFormData.email} onChange={(event) => setProfileFormData({ ...profileFormData, email: event.target.value })} placeholder="Enter your email" required />
                            <Input label="Password" type="password" value={profileFormData.password} onChange={(event) => setProfileFormData({ ...profileFormData, password: event.target.value })} placeholder="Enter new password" required />
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button type="submit" disabled={isSavingProfile} className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 py-3 font-extrabold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70">
                                    <Edit size={18} /> {isSavingProfile ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button type="button" onClick={handleDeleteAccount} disabled={isDeletingAccount} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-6 py-3 font-extrabold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70">
                                    <Trash2 size={18} /> Delete Account
                                </button>
                            </div>
                        </form>
                    </Panel>
                </div>
            </div>
        </div>
    );

    const renderAdminView = () => (
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row">
            <aside className="w-full shrink-0 md:w-64">
                <div className="sticky top-24 flex flex-col gap-2 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Admin Portal</h3>
                    {[
                        ['dashboard', <PieChart size={18} strokeWidth={2.5} />, 'Dashboard'],
                        ['menu', <Utensils size={18} strokeWidth={2.5} />, 'Menu'],
                        ['stock', <Building size={18} strokeWidth={2.5} />, 'Stock'],
                        ['staff', <Users size={18} strokeWidth={2.5} />, 'Staff'],
                    ].map(([tab, icon, label]) => (
                        <button key={tab} onClick={() => setAdminTab(tab)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 font-bold transition ${adminTab === tab ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>{icon} {label}</button>
                    ))}
                </div>
            </aside>
            <div className="flex-1">
                {adminTab === 'dashboard' && renderAdminDashboard()}
                {adminTab === 'menu' && renderMenuManager()}
                {adminTab === 'stock' && renderStockManager()}
                {adminTab === 'staff' && renderStaffManager()}
            </div>
        </div>
    );

    const renderAdminDashboard = () => {
        const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const validOrders = orders.map((order) => ({ ...order, date: order.date || todayStr }));
        const todayOrders = validOrders.filter((order) => order.date === todayStr);
        const getGroupKey = (order) => {
            const date = new Date(order.date);
            if (salesViewMode === 'monthly') return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
            if (salesViewMode === 'weekly') {
                const day = date.getDay();
                const start = new Date(date);
                start.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
                const end = new Date(start);
                end.setDate(start.getDate() + 6);
                return `${start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
            }
            return order.date;
        };
        const salesSummary = Object.values(validOrders.reduce((acc, order) => {
            const period = getGroupKey(order);
            acc[period] ??= { period, total: 0, count: 0, rawDate: new Date(order.date) };
            acc[period].total += order.total;
            acc[period].count += 1;
            if (new Date(order.date) > acc[period].rawDate) acc[period].rawDate = new Date(order.date);
            return acc;
        }, {})).sort((a, b) => b.rawDate - a.rawDate);
        const displayedOrders = selectedPeriodFilter ? validOrders.filter((order) => getGroupKey(order) === selectedPeriodFilter) : validOrders;

        return (
            <div className="space-y-6">
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Overview</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <Metric label="Total Sales Today" value={`RM ${todayOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}`} />
                    <Metric label="Total Orders Today" value={todayOrders.length} accent />
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 bg-slate-50 p-6 sm:flex-row sm:items-center sm:px-8">
                        <div><h3 className="text-lg font-extrabold text-slate-900">Sales Summary</h3><p className="mt-1 text-sm font-medium text-slate-500">Select a period to filter transactions.</p></div>
                        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                            {['daily', 'weekly', 'monthly'].map((mode) => <button key={mode} onClick={() => { setSalesViewMode(mode); setSelectedPeriodFilter(null); }} className={`rounded-lg px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition ${salesViewMode === mode ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>{mode}</button>)}
                        </div>
                    </div>
                    <DataTable headers={['Period', 'Orders', 'Revenue']} minWidth="500px">
                        {salesSummary.map((item) => (
                            <tr key={item.period} onClick={() => setSelectedPeriodFilter(item.period === selectedPeriodFilter ? null : item.period)} className={`cursor-pointer transition ${selectedPeriodFilter === item.period ? 'bg-sky-50' : 'hover:bg-slate-50'}`}>
                                <td className="p-5 font-bold text-slate-800">{item.period}</td>
                                <td className="p-5 text-center font-medium text-slate-500">{item.count}</td>
                                <td className="p-5 text-right font-extrabold text-emerald-600">RM {item.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex justify-between gap-4 border-b border-slate-100 p-6 sm:items-center sm:px-8">
                        <h3 className="text-lg font-extrabold text-slate-900">{selectedPeriodFilter ? `Transactions: ${selectedPeriodFilter}` : 'Recent Transactions'}</h3>
                        {selectedPeriodFilter && <button onClick={() => setSelectedPeriodFilter(null)} className="rounded-xl bg-red-50 px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-red-500 transition hover:bg-red-500 hover:text-white">Clear Filter</button>}
                    </div>
                    <DataTable headers={['ID & Date', 'Customer', 'Items', 'Method', 'Total']} minWidth="800px">
                        {displayedOrders.map((order) => (
                            <tr key={order.id} className="transition hover:bg-slate-50/50">
                                <td className="p-5"><div className="font-extrabold text-sky-600">{order.id}</div><div className="mt-0.5 text-xs font-bold text-slate-400">{order.date} - {order.time}</div></td>
                                <td className="p-5 font-bold text-slate-800">{order.customer}</td>
                                <td className="p-5"><ul className="space-y-1">{order.items.map((item, index) => <li key={index} className="text-xs font-bold text-slate-600">{item.name}</li>)}</ul></td>
                                <td className="p-5"><span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{order.payment}</span></td>
                                <td className="p-5 text-right font-extrabold text-slate-900">RM {order.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </DataTable>
                </div>
            </div>
        );
    };

    const renderMenuManager = () => {
        const filteredItems = adminMenuCategory === 'All' ? menuItems : menuItems.filter((item) => item.category === adminMenuCategory);

        return (
            <div>
                <ManagerHeader title="Menu Manager" subtitle="Add, update, or remove cafe items. Drag to reorder and toggle availability." action="New Item" onAction={() => { setMenuFormData(DEFAULT_MENU_FORM); setIsMenuModalOpen(true); }} />
                <CategoryTabs value={adminMenuCategory} onChange={setAdminMenuCategory} categories={MENU_CATEGORIES} allLabel="All" compact />
                <DataTable headers={['Order', 'Item Details', 'Category', 'Base Price', 'Status', 'Actions']} minWidth="800px">
                    {filteredItems.map((item, index) => (
                        <tr key={item.id} className={`group transition ${item.isAvailable === false ? 'bg-slate-50/80' : 'hover:bg-sky-50/30'}`}>
                            <td className="p-4 w-20">
                                <div className="flex flex-col items-center gap-1">
                                    <button
                                        onClick={() => moveMenuItem(index, -1)}
                                        disabled={index === 0}
                                        className={`rounded-lg p-1.5 transition ${index === 0 ? 'cursor-not-allowed text-slate-200' : 'text-slate-400 hover:bg-sky-100 hover:text-sky-600'}`}
                                        title="Move up"
                                    >
                                        <ArrowUp size={16} strokeWidth={2.5} />
                                    </button>
                                    <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                                    <button
                                        onClick={() => moveMenuItem(index, 1)}
                                        disabled={index === filteredItems.length - 1}
                                        className={`rounded-lg p-1.5 transition ${index === filteredItems.length - 1 ? 'cursor-not-allowed text-slate-200' : 'text-slate-400 hover:bg-sky-100 hover:text-sky-600'}`}
                                        title="Move down"
                                    >
                                        <ArrowDown size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </td>
                            <td className="p-5">
                                <div className="flex items-center gap-5">
                                    <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 text-sky-500 shadow-sm ${item.isAvailable === false ? 'opacity-50 grayscale' : ''}`}>
                                        <MenuItemVisual item={item} iconSize={24} />
                                    </div>
                                    <div>
                                        <div className={`mb-0.5 text-base font-extrabold ${item.isAvailable === false ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.name}</div>
                                        <div className="line-clamp-1 max-w-md text-xs font-medium text-slate-500">{item.description}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-5"><span className="rounded-md bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">{item.category}</span></td>
                            <td className="p-5 text-lg font-extrabold text-slate-900">RM {item.basePrice.toFixed(2)}</td>
                            <td className="p-5">
                                <button
                                    onClick={() => toggleMenuAvailability(item)}
                                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-extrabold uppercase tracking-wider transition ${item.isAvailable !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}`}
                                    title={item.isAvailable !== false ? 'Click to make unavailable' : 'Click to make available'}
                                >
                                    {item.isAvailable !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                                    {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                                </button>
                            </td>
                            <td className="p-5">
                                <RowActions
                                    onEdit={() => { setMenuFormData({ id: item.id, name: item.name, category: item.category, basePrice: item.basePrice, description: item.description || '', iconType: item.iconType, imageUrl: item.imageUrl || '' }); setIsMenuModalOpen(true); }}
                                    onDelete={() => deleteMenuItem(item.id)}
                                />
                            </td>
                        </tr>
                    ))}
                </DataTable>
                {isMenuModalOpen && renderMenuModal()}
            </div>
        );
    };

    const renderMenuModal = () => (
        <Modal title={menuFormData.id ? 'Edit Item' : 'New Menu Item'} onClose={() => setIsMenuModalOpen(false)}>
            <form onSubmit={saveMenuItem} className="space-y-5">
                <Input label="Item Name" value={menuFormData.name} onChange={(event) => setMenuFormData({ ...menuFormData, name: event.target.value })} placeholder="e.g. Iced Peach Tea" required />
                <div>
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Menu Image</span>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="aspect-[4/3] bg-slate-50 text-slate-300">
                            <MenuItemVisual item={{ ...menuFormData, name: menuFormData.name || 'Menu item', iconType: menuFormData.iconType || (isDrink(menuFormData.category) ? 'coffee' : 'food') }} />
                        </div>
                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                            <label className="flex flex-1 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-extrabold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-600">
                                <input type="file" accept="image/*" onChange={updateMenuImage} className="sr-only" />
                                {menuFormData.imageUrl ? 'Change Image' : 'Upload Image'}
                            </label>
                            {menuFormData.imageUrl && (
                                <button type="button" onClick={() => setMenuFormData({ ...menuFormData, imageUrl: '' })} className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-600 transition hover:bg-red-100">
                                    Remove
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</span><textarea value={menuFormData.description} onChange={(event) => setMenuFormData({ ...menuFormData, description: event.target.value })} className="w-full resize-none rounded-xl border-2 border-slate-200 p-3 font-medium text-slate-800 outline-none focus:border-sky-500" rows="2" placeholder="e.g. A refreshing blend of..." /></label>
                <div className="grid grid-cols-2 gap-5"><Select label="Category" value={menuFormData.category} onChange={(event) => setMenuFormData({ ...menuFormData, category: event.target.value })} options={MENU_CATEGORIES} /><Input label="Price (RM)" type="number" step="0.01" min="0" value={menuFormData.basePrice} onChange={(event) => setMenuFormData({ ...menuFormData, basePrice: event.target.value })} placeholder="0.00" required /></div>
                <SubmitButton label={menuFormData.id ? 'Save Changes' : 'Add Item'} />
            </form>
        </Modal>
    );

    const renderStockManager = () => (
        <div>
            <ManagerHeader title="Stock Inventory" subtitle="Monitor and update cafe supplies." action="New Supply" onAction={() => { setStockFormData({ id: null, name: '', quantity: 0, unit: 'pcs', lowStockAlert: 10 }); setIsStockModalOpen(true); }} />
            <DataTable headers={['Supply Name', 'Status', 'Quantity', 'Actions']} minWidth="600px">
                {renderStockRows(true)}
            </DataTable>
            {isStockModalOpen && renderStockModal()}
        </div>
    );

    const renderStockModal = () => (
        <Modal title={stockFormData.id ? 'Edit Supply' : 'Add Supply'} onClose={() => setIsStockModalOpen(false)}>
            <form onSubmit={saveStock} className="space-y-5">
                <Input label="Item Name" value={stockFormData.name} onChange={(event) => setStockFormData({ ...stockFormData, name: event.target.value })} placeholder="e.g. Sugar Packets" required />
                <div className="grid grid-cols-2 gap-5"><Input label="Quantity" type="number" min="0" value={stockFormData.quantity} onChange={(event) => setStockFormData({ ...stockFormData, quantity: event.target.value })} required /><Input label="Unit" value={stockFormData.unit} onChange={(event) => setStockFormData({ ...stockFormData, unit: event.target.value })} placeholder="e.g. pcs, bags" required /></div>
                <Input label="Low Alert Threshold" type="number" min="0" value={stockFormData.lowStockAlert} onChange={(event) => setStockFormData({ ...stockFormData, lowStockAlert: event.target.value })} required />
                <SubmitButton label={stockFormData.id ? 'Save Changes' : 'Add Item'} />
            </form>
        </Modal>
    );

    const renderStaffManager = () => (
        <div>
            <ManagerHeader title="Staff Registration" subtitle="Register staff accounts for cafe operations." action="Register Staff" onAction={() => { setStaffFormData({ id: null, name: '', email: '', password: '', role: 'Barista' }); setIsStaffModalOpen(true); }} />
            <DataTable headers={['Staff Name', 'Email', 'Role', 'Actions']} minWidth="700px">
                {staffMembers.map((staff) => (
                    <tr key={staff.id} className="group transition hover:bg-slate-50/50">
                        <td className="p-5 font-bold text-slate-900">{staff.name}</td>
                        <td className="p-5 font-medium text-slate-500">{staff.email}</td>
                        <td className="p-5"><span className="rounded-md bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-700">{staff.role}</span></td>
                        <td className="p-5"><RowActions onEdit={() => { setStaffFormData(staff); setIsStaffModalOpen(true); }} onDelete={() => deleteStaffMember(staff.id)} /></td>
                    </tr>
                ))}
            </DataTable>
            {isStaffModalOpen && renderStaffModal()}
        </div>
    );

    const renderStaffModal = () => (
        <Modal title={staffFormData.id ? 'Edit Staff' : 'Add New Staff'} onClose={() => setIsStaffModalOpen(false)}>
            <form onSubmit={saveStaff} className="space-y-5">
                <Input label="Staff Name" value={staffFormData.name} onChange={(event) => setStaffFormData({ ...staffFormData, name: event.target.value })} placeholder="e.g. Amin" required />
                <Input label="Email Address" type="email" value={staffFormData.email} onChange={(event) => setStaffFormData({ ...staffFormData, email: event.target.value })} placeholder="e.g. amin@mates.com" required />
                <Input label="Password" type="password" value={staffFormData.password} onChange={(event) => setStaffFormData({ ...staffFormData, password: event.target.value })} placeholder="Create staff password" required />
                <Select label="Role" value={staffFormData.role} onChange={(event) => setStaffFormData({ ...staffFormData, role: event.target.value })} options={['Manager', 'Barista', 'Cashier']} />
                <SubmitButton label={staffFormData.id ? 'Save Changes' : 'Add Staff'} />
            </form>
        </Modal>
    );

    const renderAuthShell = (title, subtitle, children) => (
        <div
            className="relative flex min-h-screen items-center justify-center overflow-hidden p-4"
            style={{
                backgroundImage: "url('/images/cafe-bg.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* Dark overlay */}
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.62)' }} />

            {/* Login card */}
            <div
                className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] shadow-2xl"
                style={{ border: '1px solid rgba(255,255,255,0.13)' }}
            >
                {/* Card header — frosted glass */}
                <div
                    className="p-10 text-center text-white"
                    style={{ background: 'rgba(15,23,42,0.78)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
                >
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 shadow-lg shadow-sky-900/50 animate-float"><Coffee size={40} strokeWidth={2} /></div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
                    <p className="mt-2 font-medium text-slate-400">{subtitle}</p>
                </div>
                {/* Card body */}
                <div className="p-8 sm:p-10" style={{ background: 'rgba(255,255,255,0.97)' }}>
                    {children}
                </div>
            </div>
        </div>
    );

    const renderAuthSelect = () => renderAuthShell('MatesCafe', ' ', (
        <div className="space-y-3">
            <button onClick={() => openAuthPage('customer-login')} className="w-full rounded-xl bg-sky-500 py-4 font-extrabold text-white shadow-md shadow-sky-900/50 transition hover:bg-sky-400">Customer Login</button>
            <button onClick={() => openAuthPage('customer-register')} className="w-full rounded-xl border-2 border-sky-100 bg-sky-50 py-4 font-extrabold text-sky-700 transition hover:bg-sky-100">Register Customer Account</button>
            <button onClick={() => openAuthPage('staff-login')} className="w-full rounded-xl border border-slate-200 bg-white py-4 font-extrabold text-slate-700 transition hover:bg-slate-50">Staff Login</button>
            <button onClick={() => openAuthPage('admin-login')} className="w-full rounded-xl border border-slate-200 bg-white py-4 font-extrabold text-slate-700 transition hover:bg-slate-50">Admin Login</button>
        </div>
    ));

    const renderCustomerLogin = () => renderAuthShell('Customer Login', 'Sign in to order from MatesCafe', (
        <>
            {loginError && <AuthError text={loginError} />}
            <form onSubmit={handleCustomerLogin} className="space-y-6">
                <LoginInput icon={<Mail size={18} />} label="Enter Email Address" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="Enter Email Address" />
                <LoginInput icon={<Lock size={18} />} label="Password" type="password" value={loginPassword} onChange={setLoginPassword} placeholder="Enter password" />
                <button type="submit" className="w-full rounded-xl bg-sky-500 py-4 font-extrabold text-white shadow-md shadow-sky-900/50 transition hover:bg-sky-400">Sign In</button>
            </form>
            <button type="button" onClick={() => openAuthPage('customer-register')} className="mt-3 block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100">Create account</button>
            <div className="mt-8 border-t border-slate-100 pt-5 flex justify-center gap-6">
                <button type="button" onClick={() => openAuthPage('staff-login')} className="text-xs font-extrabold uppercase tracking-widest text-slate-400 transition hover:text-sky-600">Staff Login</button>
                <span className="text-slate-200 select-none">|</span>
                <button type="button" onClick={() => openAuthPage('admin-login')} className="text-xs font-extrabold uppercase tracking-widest text-slate-400 transition hover:text-sky-600">Admin Login</button>
            </div>
        </>
    ));

    const renderCustomerRegister = () => renderAuthShell('Customer Register', 'Create an account for online orders', (
        <>
            {registerError && <AuthError text={registerError} />}
            <form onSubmit={handleCustomerRegister} className="space-y-6">
                <LoginInput icon={<Users size={18} />} label="Full Name" type="text" value={registerName} onChange={setRegisterName} placeholder="Enter name" />
                <LoginInput icon={<Mail size={18} />} label="Email Address" type="email" value={registerEmail} onChange={setRegisterEmail} placeholder="Enter email" />
                <LoginInput icon={<Lock size={18} />} label="Password" type="password" value={registerPassword} onChange={setRegisterPassword} placeholder="Create password" minLength="4" />
                <button type="submit" className="w-full rounded-xl bg-sky-500 py-4 font-extrabold text-white shadow-md shadow-sky-900/50 transition hover:bg-sky-400">Register</button>
            </form>
            <AuthFooter primary="Already have an account" onPrimary={() => openAuthPage('customer-login')} onBack={() => openAuthPage('customer-login')} />
        </>
    ));

    const renderRoleLogin = (role) => renderAuthShell(`${role === 'admin' ? 'Admin' : 'Staff'} Login`, `Sign in to the ${role} workspace`, (
        <>
            {loginError && <AuthError text={loginError} />}
            <form onSubmit={(event) => handleStaffLogin(event, role)} className="space-y-6">
                <LoginInput icon={<Mail size={18} />} label="Enter Email Address" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="Enter Email Address" />
                <LoginInput icon={<Lock size={18} />} label="Password" type="password" value={loginPassword} onChange={setLoginPassword} placeholder="Enter password" />
                <button type="submit" className="w-full rounded-xl bg-sky-500 py-4 font-extrabold text-white shadow-md shadow-sky-900/50 transition hover:bg-sky-400">Sign In</button>
            </form>
            <AuthFooter onBack={() => openAuthPage('customer-login')} />
        </>
    ));

    const renderAuth = () => {
        if (authPage === 'customer-register') return renderCustomerRegister();
        if (authPage === 'staff-login') return renderRoleLogin('staff');
        if (authPage === 'admin-login') return renderRoleLogin('admin');
        return renderCustomerLogin();
    };

    if (!isLoggedIn) return renderAuth();

    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 selection:bg-sky-200 selection:text-sky-900">
            {renderNavbar()}
            <main className="flex-1">
                {currentRole === 'customer' && (
                    <>
                        {currentView === 'home' && renderHome()}
                        {currentView === 'menu' && renderMenu()}
                        {currentView === 'cart' && renderCart()}
                        {currentView === 'checkout' && renderCheckout()}
                        {currentView === 'profile' && renderProfile()}
                        {currentView === 'order-history' && renderOrderHistory()}
                        {currentView === 'tracking' && renderTracking()}
                    </>
                )}
                {currentRole === 'staff' && renderStaffView()}
                {currentRole === 'admin' && renderAdminView()}
            </main>
            <footer className="mt-auto border-t border-slate-800 bg-slate-900 py-12 text-slate-400">
                <div className="mx-auto mb-8 grid max-w-6xl grid-cols-1 gap-8 px-4 text-sm md:grid-cols-3">
                    <div><div className="mb-4 flex items-center gap-2 text-white"><span className="rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 p-1.5"><Coffee size={16} strokeWidth={3} /></span><span className="text-lg font-extrabold tracking-tight">Mates<span className="text-sky-500">Cafe</span></span></div><p className="leading-relaxed">Providing high quality coffee and food. Skip the line, order online, and enjoy.</p></div>
                    <div><h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Operating Hours</h4><ul className="space-y-2"><li className="flex justify-between"><span className="font-medium text-slate-500">Mon - Sun:</span> 11:00 AM - 11:00 PM</li></ul></div>
                    <div><h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Location</h4><p className="leading-relaxed">NO 53 BAWAH,<br />Jalan Besar, PEKAN,<br />35900 Tanjong Malim, Perak</p><a href="https://maps.app.goo.gl/KJ8GHqP4KRKsguTY6" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 transition hover:text-sky-300">Open in Google Maps &rarr;</a></div>
                </div>
                <div className="mx-auto max-w-6xl border-t border-slate-800/50 px-4 pt-8 text-center text-xs font-medium"><p>&copy; 2026 Mates Cafe, Tanjong Malim. All rights reserved.</p><p className="mt-2 opacity-50">Software Engineering Project - Group 2</p></div>
            </footer>
        </div>
    );
}

function NavButton({ icon, label, onClick }) {
    return <button onClick={onClick} className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">{icon}<span className="hidden sm:inline">{label}</span></button>;
}

function Feature({ icon, title, text, color }) {
    const colors = {
        amber: 'bg-amber-50 text-amber-600 shadow-amber-100/50',
        sky: 'bg-sky-50 text-sky-600 shadow-sky-100/50',
        emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100/50',
    };
    return <div className="group rounded-[2.5rem] border border-slate-100/50 bg-white p-10 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:border-slate-200/80"><div className={`mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-3xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${colors[color]}`}>{icon}</div><h3 className="mb-4 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h3><p className="leading-relaxed text-slate-500">{text}</p></div>;
}

function PageTitle({ title, subtitle }) {
    return <div className="mb-14 text-center"><h2 className="mb-4 text-5xl font-extrabold tracking-tight text-slate-900">{title}</h2>{subtitle && <p className="text-lg text-slate-500">{subtitle}</p>}</div>;
}

function CategoryTabs({ value, onChange, categories, allLabel, compact = false }) {
    const classes = compact ? 'px-6 py-2.5 text-xs uppercase tracking-wider' : 'px-8 py-3.5 text-sm';
    return <div className="mb-12 flex gap-3 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><button onClick={() => onChange('All')} className={`whitespace-nowrap rounded-full font-extrabold transition ${classes} ${value === 'All' ? 'bg-slate-900 text-white shadow-lg' : 'border-2 border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-900'}`}>{allLabel}</button>{categories.map((category) => <button key={category} onClick={() => onChange(category)} className={`whitespace-nowrap rounded-full font-extrabold transition ${classes} ${value === category ? 'bg-slate-900 text-white shadow-lg' : 'border-2 border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:text-slate-900'}`}>{category}</button>)}</div>;
}

function Modal({ title, onClose, children, tone = 'slate' }) {
    const headerClass = tone === 'orange' ? 'bg-orange-500' : tone === 'red' ? 'bg-red-500' : 'bg-slate-900';
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"><div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl"><div className={`flex items-center justify-between p-5 text-white ${headerClass}`}><h3 className="font-bold tracking-wide">{title}</h3><button onClick={onClose} className="rounded-full p-1.5 transition hover:bg-white/15"><X size={20} /></button></div><div className="custom-scrollbar max-h-[calc(90vh-4rem)] overflow-y-auto bg-slate-50/30 p-6 sm:p-8">{children}</div></div></div>;
}

function OptionGroup({ label, options, value, name, cols, setCustomOptions }) {
    return <div><label className="mb-3 block text-sm font-bold uppercase tracking-wider text-slate-800">{label}</label><div className={`grid gap-3 ${cols}`}>{options.map(([text, optionValue]) => <button key={optionValue} type="button" onClick={() => setCustomOptions((current) => ({ ...current, [name]: optionValue }))} className={`rounded-xl border-2 px-2 py-3 text-xs font-bold transition ${value === optionValue ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>{text}</button>)}</div></div>;
}

function EmptyState({ icon, title, text, action, onAction }) {
    return <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm"><div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">{icon}</div><h3 className="mb-2 text-xl font-bold text-slate-700">{title}</h3><p className="mb-6 text-slate-500">{text}</p><button onClick={onAction} className="rounded-full bg-slate-900 px-8 py-3 font-bold text-white transition hover:bg-sky-600">{action}</button></div>;
}

function Panel({ title, children }) {
    return <div className="space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8"><h3 className="text-xl font-bold text-slate-900">{title}</h3>{children}</div>;
}

function Input({ label, ...props }) {
    return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><input {...props} className="w-full rounded-xl border-2 border-slate-200 p-3 font-bold text-slate-800 outline-none transition focus:border-sky-500" /></label>;
}

function Select({ label, options, ...props }) {
    return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><select {...props} className="w-full cursor-pointer rounded-xl border-2 border-slate-200 bg-white p-3 font-bold text-slate-800 outline-none transition focus:border-sky-500">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function SubmitButton({ label }) {
    return <button type="submit" className="mt-4 w-full rounded-xl bg-sky-500 py-4 font-extrabold text-white shadow-md transition hover:bg-sky-400">{label}</button>;
}

function LoginInput({ icon, label, value, onChange, ...props }) {
    return <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span><span className="relative block"><span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">{icon}</span><input {...props} required value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 p-3.5 pl-12 font-medium text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white" /></span></label>;
}

function AuthError({ text }) {
    return <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600"><AlertCircle size={18} /> {text}</div>;
}

function AuthFooter({ primary, onPrimary, onBack }) {
    return <div className="mt-8 border-t border-slate-100 pt-6 text-center">{primary && <button type="button" onClick={onPrimary} className="mb-3 block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-sm font-extrabold text-slate-700 transition hover:bg-slate-100">{primary}</button>}<button type="button" onClick={onBack} className="text-xs font-extrabold uppercase tracking-widest text-slate-400 transition hover:text-sky-600">Back to account options</button></div>;
}

function OrderCard({ order, onView }) {
    return <div className="flex flex-col gap-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-sky-200 sm:p-8"><div className="flex items-start justify-between border-b border-slate-100 pb-5"><div><div className="mb-1 flex flex-wrap items-center gap-3"><span className="text-lg font-extrabold text-slate-900">{order.id}</span><StatusBadge status={order.status} />{order.delay && order.status !== 'Canceled' && <span className="rounded-md bg-orange-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-700">Delayed</span>}</div><div className="text-sm font-medium text-slate-400">{order.date} at {order.time}</div></div><button onClick={onView} className="shrink-0 rounded-xl bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-900 hover:text-white">View Details</button></div><ItemRows items={order.items} /><div className="mt-2 flex flex-col justify-between gap-4 rounded-2xl bg-slate-50 p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500"><CreditCard size={16} /><span>Paid via {order.payment === 'fpx' ? 'FPX' : order.payment === 'ewallet' ? 'E-Wallet' : 'Card'}</span></div><div className="flex items-center justify-between gap-4 sm:justify-end"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total</span><span className="text-xl font-extrabold text-slate-900">RM {order.total.toFixed(2)}</span></div></div></div>;
}

function StatusBadge({ status }) {
    const classes = {
        Pending: 'bg-slate-100 text-slate-600',
        Preparing: 'bg-amber-100 text-amber-700',
        Ready: 'bg-sky-100 text-sky-700',
        Completed: 'bg-emerald-100 text-emerald-700',
        Canceled: 'bg-red-100 text-red-700',
    };
    return <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${classes[status]}`}>{status}</span>;
}

function ItemRows({ items }) {
    return <div className="space-y-4">{items.map((item, index) => <div key={index} className="flex items-start justify-between gap-4"><div className="flex flex-col"><span className="text-sm font-bold text-slate-800">{item.name}</span><span className="mt-0.5 max-w-md text-xs font-medium leading-relaxed text-slate-500">{item.details}</span></div><span className="shrink-0 text-sm font-bold text-slate-900">RM {item.price.toFixed(2)}</span></div>)}</div>;
}

function ItemList({ items }) {
    return <ul className="space-y-3">{items.map((item, index) => <li key={index} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm"><span className="mb-1 block text-sm font-extrabold text-slate-800">{item.name}</span><div className="text-xs font-medium leading-relaxed text-slate-500">{item.details}</div></li>)}</ul>;
}

function AlertPanel({ tone, title, text }) {
    const classes = tone === 'red' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-orange-50 border-orange-100 text-orange-800';
    const icon = tone === 'red' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600';
    return <div className={`mb-8 flex items-start gap-4 rounded-3xl border p-6 text-left shadow-sm ${classes}`}><div className={`shrink-0 rounded-xl p-2 ${icon}`}><AlertCircle size={24} /></div><div><h4 className="text-lg font-bold">{title}</h4><p className="mt-1 text-sm font-medium">{text}</p></div></div>;
}

function trackingText(status) {
    return {
        Pending: 'Cafe is reviewing your order.',
        Preparing: 'Your food & drinks are being prepared.',
        Ready: 'Your order is ready at the counter!',
        Completed: 'Order collected. Enjoy!',
    }[status];
}

function DataTable({ headers, children, minWidth }) {
    return <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full border-collapse text-left" style={{ minWidth }}><thead><tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{headers.map((header) => <th key={header} className={`p-5 ${header === 'Actions' || header === 'Revenue' || header === 'Total' ? 'text-right' : ''}`}>{header}</th>)}</tr></thead><tbody className="divide-y divide-slate-50">{children}</tbody></table></div></div>;
}

function ManagerHeader({ title, subtitle, action, onAction }) {
    return <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>}</div>{action && <button onClick={onAction} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 font-extrabold text-white shadow-md transition hover:bg-sky-500 sm:w-auto"><Plus size={18} strokeWidth={2.5} /> {action}</button>}</div>;
}

function Metric({ label, value, accent = false }) {
    return <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm"><div className="mb-2 text-sm font-bold uppercase tracking-wider text-slate-400">{label}</div><div className={`text-4xl font-extrabold ${accent ? 'text-sky-500' : 'text-slate-900'}`}>{value}</div></div>;
}

function RowActions({ onEdit, onDelete }) {
    return <div className="flex justify-end gap-2"><button onClick={onEdit} className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-slate-400 transition hover:bg-sky-100 hover:text-sky-600" title="Edit"><Edit size={16} /></button><button onClick={onDelete} className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-slate-400 transition hover:bg-red-100 hover:text-red-600" title="Delete"><Trash2 size={16} /></button></div>;
}

function Badge({ text, danger = false, icon = null }) {
    return <span className={`flex w-max items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest ${danger ? 'border-red-100 bg-red-50 text-red-600' : 'border-emerald-100 bg-emerald-50 text-emerald-600'}`}>{icon}{text}</span>;
}
