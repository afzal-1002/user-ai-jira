export class User {
  constructor(
    private _id: number,
    private _userName: string,
    private _firstName: string,
    private _lastName: string,
    private _userEmail: string,
    private _phoneNumber: string,
    private _password: string,
    private _userRole: string[] ,
    private _isLoggedIn: boolean,
    private _accountId?: string,
    private _displayName?: string,
    private _active?: boolean,
    private _baseUrl?: string
  ) { }

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get userName(): string {
    return this._userName;
  }

  set userName(value: string) {
    this._userName = value;
  }

  get firstName(): string {
    return this._firstName;
  }

  set firstName(value: string) {
    this._firstName = value;
  }

  get lastName(): string {
    return this._lastName;
  }

  set lastName(value: string) {
    this._lastName = value;
  }

  get userEmail(): string {
    return this._userEmail;
  }

  set userEmail(value: string) {
    this._userEmail = value;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  set phoneNumber(value: string) {
    this._phoneNumber = value;
  }

  get password(): string {
    return this._password;
  }

  set password(value: string) {
    this._password = value;
  }

  get isLoggedIn(): boolean {
    return this._isLoggedIn;
  }

  set isLoggedIn(value: boolean) {
    this._isLoggedIn = value;
  }

  get userRole(): string[] {
    return this._userRole;
  }

  set userRole(value: string[]) {
    this._userRole = value;
  }

  get accountId(): string | undefined {
    return this._accountId;
  }

  set accountId(value: string | undefined) {
    this._accountId = value;
  }

  get displayName(): string | undefined {
    return this._displayName;
  }

  set displayName(value: string | undefined) {
    this._displayName = value;
  }

  get active(): boolean | undefined {
    return this._active;
  }

  set active(value: boolean | undefined) {
    this._active = value;
  }

  get baseUrl(): string | undefined {
    return this._baseUrl;
  }

  set baseUrl(value: string | undefined) {
    this._baseUrl = value;
  }
}
