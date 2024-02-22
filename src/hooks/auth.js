import useSWR from 'swr'
import axios from '@/lib/axios'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

axios.defaults.xsrfCookieName = 'XSRF-TOKEN'
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN'

export const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
    const router = useRouter()

    const { data: user, error, mutate } = useSWR('/api/user', () =>
        axios
            .get('/api/user')
            .then(res => res.data)
            .catch(error => {
                if (error.response.status !== 409) throw error

                router.push('/verify-email')
            }),
    )

    const csrf = () => axios.get('/sanctum/csrf-cookie')

    const register = async ({ setErrors, ...props }) => {
        await csrf()

        setErrors([])

        axios
            .post('/register', props)
            .then(() => mutate())
            .catch(error => {
                if (error.response.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const registerWeight = async ({ setErrors, ...props }) => {
        await csrf()

        setErrors([])

        axios
            .post('/api/weights', props)
            .then(() => {
                toast.success('Peso adicionado com sucesso!')
                mutate()
            })
            .catch(error => {
                if (error.response.status !== 422) throw error
                toast.error('O peso não foi adicionado!')
                setErrors(error.response.data.errors)
            })
    }

    const updateWeight = async ({ setErrors, ...props }) => {
        await csrf()
        setErrors([])

        axios
            .put(`api/weights/${props.idWeight.weight}`, props)
            .then(() => {
                toast.success('Peso atualizado com sucesso!')
                mutate()
            })
            .catch(error => {
                if (error.response.status !== 422) throw error
                toast.error('O peso não foi atualizado!')
                setErrors(error.response.data.errors)
            })
    }

    const deleteWeight = async idWeight => {
        try {
            await csrf()
            await axios.delete(`api/weights/${idWeight}`)
            toast.success('Peso deletado com sucesso!')
            mutate()
        } catch (error) {
            toast.error('O peso não foi deletado com sucesso!')
        }
    }

    const login = async ({ setErrors, setStatus, ...props }) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/login', props)
            .then(() => mutate())
            .catch(error => {
                if (error.response.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const forgotPassword = async ({ setErrors, setStatus, email }) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/forgot-password', { email })
            .then(response => setStatus(response.data.status))
            .catch(error => {
                if (error.response.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const resetPassword = async ({ setErrors, setStatus, ...props }) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/reset-password', { token: router.query.token, ...props })
            .then(response =>
                router.push('/login?reset=' + btoa(response.data.status)),
            )
            .catch(error => {
                if (error.response.status !== 422) throw error

                setErrors(error.response.data.errors)
            })
    }

    const resendEmailVerification = ({ setStatus }) => {
        axios
            .post('/email/verification-notification')
            .then(response => setStatus(response.data.status))
    }

    const logout = async () => {
        if (!error) {
            await axios.post('/logout').then(() => mutate())
        }

        window.location.pathname = '/login'
    }

    useEffect(() => {
        if (middleware === 'guest' && redirectIfAuthenticated && user)
            router.push(redirectIfAuthenticated)
        if (
            window.location.pathname === '/verify-email' &&
            user?.email_verified_at
        )
            router.push(redirectIfAuthenticated)
        if (middleware === 'auth' && error) logout()
    }, [user, error])

    return {
        user,
        register,
        registerWeight,
        updateWeight,
        deleteWeight,
        login,
        forgotPassword,
        resetPassword,
        resendEmailVerification,
        logout,
    }
}
