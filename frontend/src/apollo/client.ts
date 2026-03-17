import { ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { ErrorLink } from "@apollo/client/link/error";
import createUploadLink from "apollo-upload-client/UploadHttpLink.mjs";

const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);

      if (message.includes("Signature has expired") || message.includes("Authentication required")) {
        console.warn("Session expired. Clearing token and redirecting...");
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    });
  } else {
    console.error(`[Network error]: ${error}`);
  }
});

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
        "apollo-require-preflight": "true",
      },
    }));
  } else {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        "apollo-require-preflight": "true",
      },
    }));
  }

  return forward(operation);
});

const httpLink = new createUploadLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || "http://localhost:8000/graphql/",
});

const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});

export default client;
