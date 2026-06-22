function requireOrganizationId(organizationId) {
  if (!organizationId || typeof organizationId !== 'string') {
    const error = new Error('organization_id is required');
    error.statusCode = 400;
    throw error;
  }

  return organizationId;
}

function withOrganizationScope(organizationId, where = {}) {
  return {
    ...where,
    organizationId: requireOrganizationId(organizationId),
  };
}

module.exports = {
  requireOrganizationId,
  withOrganizationScope,
};
