export const GET_EVENTS_BY_LEAGUE_QUERY = `
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
