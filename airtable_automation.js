const { leaderId } = input.config();

const idvTable = base.getTable('idv_results');
const clubsTable = base.getTable('Clubs');
const leadersTable = base.getTable('Leaders');

const idvResults = await idvTable.selectRecordsAsync({ fields: ['submission_id', 'idv_status', 'slack_id', 'matched'] });
const clubs = await clubsTable.selectRecordsAsync({ fields: ['temp_leader_id', 'rel_leader'] });

for (const idvRecord of idvResults.records) {
  if (idvRecord.getCellValue('matched')) continue;

  const submissionId = idvRecord.getCellValueAsString('submission_id');
  const idvStatus = idvRecord.getCellValueAsString('idv_status');
  const slackId = idvRecord.getCellValueAsString('slack_id');

  const club = clubs.records.find(r => r.getCellValueAsString('temp_leader_id') === submissionId);
  if (!club) continue;

  const relLeader = club.getCellValue('rel_leader');
  if (!relLeader || !relLeader[0]) continue;

  const leaderFields = { 'idv_status': { name: idvStatus } };
  if (slackId) leaderFields['slack_id'] = slackId;

  await leadersTable.updateRecordAsync(relLeader[0].id, leaderFields);

  await idvTable.updateRecordAsync(idvRecord.id, { 'matched': true });
}