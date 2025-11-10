export const GET_ALL_EVENTS_QUERY = `
  query GetAllEvents($leagues: [String!]!) {
    event(
      where: {
        _and: [
          { _or: [{ status: { _eq: "OPEN_PREGAME" } }, { status: { _eq: "OPEN_INGAME" } }] }
          { game: { league: { _in: $leagues } } }
        ]
      }
      limit: 50
    ) {
      description
      id
      status
      game {
        scheduled_start
        league
      }
      markets(limit: 12) {
        description
        id
        outcomes(
          where: { _or: [{ last: { _is_null: false } }, { available: { _is_null: false } }] }
          limit: 4
        ) {
          description
          last
          available
          id
        }
      }
    }
  }
`;

export const GET_EVENT_DETAIL_QUERY = `
  query GetEventDetail($eventId: uuid!) {
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
          orders(
            where: { status: { _eq: "OPEN" }, currency: { _eq: "CASH" } }
            limit: 10
          ) {
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
