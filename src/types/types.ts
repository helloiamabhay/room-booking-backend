export interface DBConfig {
    host: string;
    user: string,
    password: string,
    database: string
}

export interface createUserBodyData {
    first_name: string;
    last_name: string;
    password: string;
    email?: string;
    phone: number;
    altPhone?: number;
    state: string;
    district: string;
    town: string;
    pinCode: number;
    gender: string;
}