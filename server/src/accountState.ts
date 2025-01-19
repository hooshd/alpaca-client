import { types } from 'adaptic-backend';

let currentAccount: types.AlpacaAccount | null = null;

export function setCurrentAccount(account: types.AlpacaAccount | null) {
    currentAccount = account;
}

export function getCurrentAccount(): types.AlpacaAccount | null {
    return currentAccount;
}
