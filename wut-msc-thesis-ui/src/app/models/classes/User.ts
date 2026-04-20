import { IUser } from "../../model/interface/IUser";

export class User  implements IUser  {
    id: number;
    username: string
    email: string;
    password: string;

    constructor(id: number, username: string, email: string, password: string) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.password = password;
    }
}
