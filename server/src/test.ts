import { fetchAllLiveAlpacaAccounts } from "./adaptic-functions";

(async () => {
  const accounts = await fetchAllLiveAlpacaAccounts();
  console.log(accounts);  
})();
