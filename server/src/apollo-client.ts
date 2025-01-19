import { getApolloClient } from 'adaptic-backend/client';
import { ApolloClient } from '@apollo/client';   
export const apolloClient = getApolloClient() as ApolloClient<any>;