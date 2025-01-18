import { getApolloClient } from 'adaptic-backend/server/client';
import { ApolloClient } from '@apollo/client';   
export const client = getApolloClient() as ApolloClient<any>;