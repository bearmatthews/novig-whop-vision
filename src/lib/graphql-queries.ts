import { gql } from '@apollo/client';

export const GET_EVENTS_BY_LEAGUE = gql`
  query GetEventsByLeague($league: String!) {
    event(
      where: {
        _and: [
          { _or: [{ status: { _eq: "OPEN_PREGAME" } }, { status: { _eq: "OPEN_INGAME" } }] }
          { game: { league: { _eq: $league } } }
        ]
      }
    ) {
      description
      id
      status
      game {
        scheduled_start
        league
      }
      markets {
        description
        id
        outcomes(where: { _or: [{ last: { _is_null: false } }, { available: { _is_null: false } }] }) {
          description
          last
          available
          id
        }
      }
    }
  }
`;

export const GET_ACTIVE_EVENT_IDS = gql`
  query GetActiveEventIds($league: String!) {
    event(where: { status: { _in: ["OPEN_PREGAME", "OPEN_INGAME"] }, game: { league: { _eq: $league } } }) {
      id
      description
      status
      game {
        scheduled_start
        league
      }
    }
  }
`;

export const GET_EVENT_LIQUIDITY = gql`
  query GetEventLiquidity($eventId: uuid!) {
    event(where: { id: { _eq: $eventId } }) {
      description
      id
      status
      game {
        scheduled_start
        league
      }
      markets {
        description
        id
        outcomes(where: { _or: [{ last: { _is_null: false } }, { available: { _is_null: false } }] }) {
          description
          id
          last
          available
          orders(where: { status: { _eq: "OPEN" }, currency: { _eq: "CASH" } }) {
            status
            qty
            price
            id
          }
        }
      }
    }
  }
`;

export const GET_ALL_EVENTS_WITH_LIQUIDITY = gql`
  query GetAllEventsWithLiquidity($league: String!) {
    event(
      where: {
        _and: [
          { _or: [{ status: { _eq: "OPEN_PREGAME" } }, { status: { _eq: "OPEN_INGAME" } }] }
          { game: { league: { _eq: $league } } }
        ]
      }
    ) {
      description
      id
      status
      game {
        scheduled_start
        league
      }
      markets {
        description
        id
        outcomes(where: { _or: [{ last: { _is_null: false } }, { available: { _is_null: false } }] }) {
          description
          id
          last
          available
          orders(where: { status: { _eq: "OPEN" }, currency: { _eq: "CASH" } }) {
            status
            qty
            price
            id
          }
        }
      }
    }
  }
`;
