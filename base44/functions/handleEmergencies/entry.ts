import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, session_id, callsign, emergency_type } = await req.json();

  try {
    const session = await base44.entities.ATCSession.get(session_id);
    
    if (action === 'declare') {
      // Declare emergency and prioritize aircraft
      const aircraft = await base44.entities.Aircraft.get(callsign.split(':')[0]);
      
      await base44.entities.Aircraft.update(aircraft.id, {
        emergency_type: emergency_type || 'fuel_low',
        status: 'emergency',
      });

      const emergencyMessages = {
        'engine_failure': `${callsign}, MAYDAY MAYDAY. Engine failure declared. Descend to 3000 feet, divert to nearest suitable airport.`,
        'fuel_low': `${callsign}, emergency fuel. Begin descent immediately to 2000 feet.`,
        'medical': `${callsign}, medical emergency declared. Priority landing runway 04L.`,
        'weather': `${callsign}, severe weather avoidance. Turn left heading 270, climb to 5000 feet.`,
      };

      return Response.json({
        success: true,
        emergency: emergency_type,
        clearance: emergencyMessages[emergency_type] || `${callsign}, emergency assistance coordinated.`,
        priority: 1,
      });
    }

    if (action === 'check_separation') {
      // Check all aircraft for separation violations
      const aircraft = await base44.entities.Aircraft.filter({ session_id });
      const violations = [];

      for (let i = 0; i < aircraft.length; i++) {
        for (let j = i + 1; j < aircraft.length; j++) {
          const a1 = aircraft[i];
          const a2 = aircraft[j];

          // Horizontal separation: 3nm minimum
          const horizontalDist = Math.hypot(
            (a1.latitude - a2.latitude) * 69,
            (a1.longitude - a2.longitude) * 69
          );

          // Vertical separation
          const verticalDist = Math.abs(a1.altitude - a2.altitude);

          const minHorizontal = 3;
          const minVertical = a1.altitude > 10000 ? 2000 : 1000;

          if (horizontalDist < minHorizontal && verticalDist < minVertical) {
            violations.push({
              aircraft1: a1.callsign,
              aircraft2: a2.callsign,
              horizontal_distance: horizontalDist.toFixed(2),
              vertical_distance: verticalDist,
              severity: 'critical',
            });

            // Update violation flag
            await base44.entities.Aircraft.update(a1.id, { separation_violation: true });
            await base44.entities.Aircraft.update(a2.id, { separation_violation: true });
          }
        }
      }

      return Response.json({
        violations,
        safe: violations.length === 0,
        message: violations.length === 0 ? 'All aircraft safely separated' : `${violations.length} separation violation(s) detected`,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});