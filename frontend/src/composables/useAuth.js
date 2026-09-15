import { ref, computed } from 'vue';

const user = ref(null);
const token = ref(localStorage.getItem('pandory_jwt') || null);

// Initialize user state from JWT if it exists and is valid
if (token.value) {
    try {
        const payload = JSON.parse(atob(token.value.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
            user.value = {
                id: payload.id,
                username: payload.username,
                avatar: payload.avatar,
                isOwner: payload.isOwner
            };
        } else {
            token.value = null;
            localStorage.removeItem('pandory_jwt');
        }
    } catch (e) {
        token.value = null;
        localStorage.removeItem('pandory_jwt');
    }
}

export function useAuth() {
    const isAuthenticated = computed(() => !!user.value);
    const isOwner = computed(() => user.value?.isOwner || false);
    console.log('isOwner', isOwner);
    const login = (jwtToken, userData) => {
        token.value = jwtToken;
        user.value = userData;
        localStorage.setItem('pandory_jwt', jwtToken);
    };

    const logout = () => {
        token.value = null;
        user.value = null;
        localStorage.removeItem('pandory_jwt');
        // Optionally redirect or reload
        window.location.href = '/';
    };

    const getAuthHeader = () => {
        return token.value ? `Bearer ${token.value}` : '';
    };

    return {
        user,
        token,
        isAuthenticated,
        isOwner,
        login,
        logout,
        getAuthHeader
    };
}
