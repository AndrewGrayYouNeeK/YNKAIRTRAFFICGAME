import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { session_id } = await req.json();

  try {
    const session = await base44.entities.ATCSession.get(session_id);
    const aircraft = await base44.entities.Aircraft.filter({ session_id });

    // Calculate workload metrics
    const inbound = aircraft.filter(a => a.status === 'inbound').length;
    const approaching = aircraft.filter(a => a.status === 'approach' || a.status === 'final').length;
    const emergencies = aircraft.filter(a => a.emergency_type !== 'none').length;
    const violations = aircraft.filter(a => a.separation_violation).length;

    // Wake turbulence analysis
    const heavyAircraft = aircraft.filter(a => a.wake_category === 'heavy');
    const lightAircraft = aircraft.filter(a => a.wake_category === 'light');
    const wakeTurbulenceRisk = heavyAircraft.length > 0 && lightAircraft.length > 0 ? 'HIGH' : 'LOW';

    // Runway management
    const landingQueue = aircraft
      .filter(a => a.status === 'final' || a.status === 'landing')
      .sort((a, b) => a.altitude - b.altitude);

    // Controller performance
    const score = session.score;
    const performance = {
      landings: session.successful_landings,
      failures: session.failed_landings,
      emergencies_handled: session.emergencies_handled,
      current_workload: `${inbound + approaching + emergencies} aircraft`,
      violations: violations,
    };

    // Recommendations
    const recommendations = [];
    if (inbound > session.max_aircraft * 0.8) recommendations.push('Capacity near limit. Consider holding pattern.');
    if (emergencies > 0) recommendations.push('Emergency aircraft detected. Prioritize landing sequence.');
    if (violations > 0) recommendations.push('Separation violations active. Issue immediate corrective clearances.');
    if (wakeTurbulenceRisk === 'HIGH') recommendations.push('Heavy aircraft detected. Ensure minimum wake turbulence separations (4nm).');

    return Response.json({
      airspace_status: {
        total_aircraft: aircraft.length,
        inbound,
        approaching,
        emergencies,
        violations,
        wake_turbulence_risk: wakeTurbulenceRisk,
        landing_queue: landingQueue.map(a => ({
          callsign: a.callsign,
          runway: a.runway,
          altitude: a.altitude,
          distance_to_runway: Math.floor(Math.random() * 25) + 5,
        })),
      },
      performance,
      recommendations,
      controller_score: score,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});