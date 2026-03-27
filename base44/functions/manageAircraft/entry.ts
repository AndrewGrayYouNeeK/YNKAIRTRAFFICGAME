import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, session_id, callsign, aircraft_type, wake_category, altitude, heading, speed, status, runway, emergency_type } = await req.json();

  try {
    const session = await base44.entities.ATCSession.get(session_id);
    
    if (action === 'spawn') {
      // Spawn new aircraft with realistic patterns
      const aircraft = await base44.entities.Aircraft.create({
        session_id,
        callsign: callsign || `${['AAL', 'UAL', 'SWA', 'DAL'][Math.floor(Math.random() * 4)]}${Math.floor(Math.random() * 900) + 100}`,
        aircraft_type: aircraft_type || ['Boeing 737', 'Airbus A320', 'Boeing 777'][Math.floor(Math.random() * 3)],
        wake_category: wake_category || ['light', 'medium', 'heavy'][Math.floor(Math.random() * 3)],
        latitude: 40.7128 + (Math.random() - 0.5) * 0.2,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.2,
        altitude: altitude || 25000,
        heading: heading || Math.floor(Math.random() * 360),
        speed: speed || 450,
        vertical_speed: 0,
        status: status || 'inbound',
        assigned_altitude: altitude || 25000,
        assigned_heading: heading || Math.floor(Math.random() * 360),
        assigned_speed: speed || 450,
        destination: 'JFK',
        emergency_type: 'none',
      });

      return Response.json({
        success: true,
        aircraft,
        message: `${aircraft.callsign} spawned at ${aircraft.altitude} feet, heading ${aircraft.heading}°`,
      });
    }

    if (action === 'update') {
      const aircraft = await base44.entities.Aircraft.get(callsign.split(':')[0]);
      
      const updates = {};
      if (altitude !== undefined) updates.assigned_altitude = altitude;
      if (heading !== undefined) updates.assigned_heading = heading;
      if (speed !== undefined) updates.assigned_speed = speed;
      if (status !== undefined) updates.status = status;
      if (runway !== undefined) updates.runway = runway;
      if (emergency_type) {
        updates.emergency_type = emergency_type;
        updates.status = 'emergency';
      }

      const updated = await base44.entities.Aircraft.update(aircraft.id, updates);
      
      return Response.json({
        success: true,
        aircraft: updated,
        clearance: `${aircraft.callsign}, cleared to ${updates.assigned_altitude ? updates.assigned_altitude + ' feet' : ''} ${updates.assigned_heading ? 'heading ' + updates.assigned_heading : ''} ${updates.assigned_speed ? updates.assigned_speed + ' knots' : ''}`.trim(),
      });
    }

    if (action === 'land') {
      const aircraft = await base44.entities.Aircraft.get(callsign.split(':')[0]);
      
      await base44.entities.Aircraft.update(aircraft.id, {
        status: 'landed',
        vertical_speed: 0,
        altitude: 0,
      });

      await base44.entities.ATCSession.update(session_id, {
        successful_landings: session.successful_landings + 1,
        score: session.score + 100,
      });

      return Response.json({
        success: true,
        message: `${aircraft.callsign} touched down on runway ${aircraft.runway}. Welcome to JFK!`,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});