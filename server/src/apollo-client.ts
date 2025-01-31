import { ApolloClient, InMemoryCache, HttpLink, NormalizedCacheObject } from '@apollo/client';
import { setContext } from '@apollo/client/link/context/context.cjs';
import { onError } from '@apollo/client/link/error/error.cjs';

let apolloClient: ApolloClient<NormalizedCacheObject> | null = null;

function initializeApollo(): ApolloClient<NormalizedCacheObject> {
  const isProduction = process.env.NODE_ENV === 'production';
  const httpUrl = isProduction
    ? process.env.BACKEND_HTTPS_URL || 'https://adaptic-backend-production.up.railway.app/graphql'
    : 'http://localhost:4000/graphql';

  const httpLink = new HttpLink({ uri: httpUrl, fetch });

  const authLink = setContext((_, { headers }) => {

    const token = process.env.SERVER_AUTH_TOKEN || '';
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
        connection: 'close',
      },
    };
  });

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
      );
    }

    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }
  });

  return new ApolloClient({
    link: errorLink.concat(authLink.concat(httpLink)),
    cache: new InMemoryCache(),
  });
}

function getApolloClient(): ApolloClient<NormalizedCacheObject> {
  if (!apolloClient) {
    apolloClient = initializeApollo();
  }
  return apolloClient;
}

export const sharedApolloClient = getApolloClient();
