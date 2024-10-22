export interface DBConfig {
    host: string;
    user: string,
    password: string,
    database: string
}

export interface createUserBodyData {
    userId: string;
    first_name: string;
    last_name?: string;
    email: string;
    password: string;
    phone?: number;
    altPhone?: number;
    state?: string;
    district?: string;
    town?: string;
    pinCode?: number;
    gender?: string;
}

export interface loginDataType {
    phoneOrEmail: string | number;
    password: string;
}

export interface createAdminDataType {
    first_name: string;
    last_name?: string;
    phone: number;
    email: string;
    password: string;
    hostel_name: string;
    state: string;
    district: string;
    town_name: string;
    pinCode: number;
    gender: string;
}

