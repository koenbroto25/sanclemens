import { create } from "zustand"
import { persist } from "zustand/middleware"

export type HomepageContext = "paroki" | "lingkungan" | "marketplace" | "gate-hub"

interface UserData {
  id: string
  phone: string              // WhatsApp login — ganti dari email (v4.0)
  nama_lengkap: string
  nama_baptis?: string
  access_layer: number
  role: string
  lingkungan_id?: string | null
  lingkungan_slug?: string | null
  family_id?: string | null  // BARU v4.0: koneksi keluarga
  status: "active" | "pending" | "rejected"
  foto_profil_url?: string | null
}

interface AuthState {
  user: UserData | null
  session: any | null
  isLoading: boolean
  homepageContext: HomepageContext
  setHomepageContext: (context: HomepageContext) => void
  setUser: (user: UserData | null) => void
  setSession: (session: any | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      homepageContext: "paroki",

      setHomepageContext: (homepageContext) => set({ homepageContext }),
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      clearAuth: () =>
        set({
          user: null,
          session: null,
          homepageContext: "paroki",
        }),
    }),
    {
      name: "paroki-auth-storage",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        homepageContext: state.homepageContext,
      }),
    }
  )
)

// === Selectors (derived helpers) ===

/** User is logged in AND has active status */
export const selectIsLoggedIn = (state: AuthState) =>
  state.user !== null && state.user?.status === "active"

/** User has a lingkungan_id (can access Pintu 2) */
export const selectCanAccessPintu2 = (state: AuthState) =>
  state.user?.lingkungan_id != null

/** Marketplace feature flag is enabled (Pintu 3) */
export const selectCanAccessPintu3 = () =>
  process.env.NEXT_PUBLIC_ENABLE_MARKETPLACE === "true"

export type { AuthState, UserData }
