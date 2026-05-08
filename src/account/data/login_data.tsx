

interface User {
    username: string,
    fullname: string,
    email: string,
    password: string
}


export function logData() {

    const userDatabase: Record<string, User> = {

        'ElktrumElk': {
            username: 'ElktrumElk',
            fullname: 'Elkanah Cole',
            email: 'elk232@gmail.com',
            password: '123456789'
        },

        'Favmaclegend': {
            username: 'Favmaclegend',
            fullname: 'Favour Mac',
            email: 'fav4618@gmail.com',
            password: 'favour2468'
        }
    }

    return { userDatabase }
}