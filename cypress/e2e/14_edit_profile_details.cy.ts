describe('User profile editing', () => {
  let activeUser = 'alice';

  const UserProfile = {
    description: 'An organization focused on amazing projects.',
    twitter: 'Abubakar80461830',
    github: 'amazing',
    coding_language: ['Lightning', 'Typescript', 'Golang']
  };

  beforeEach(() => {
    cy.login(activeUser);
  });

  it('Allows a user to edit their profile details', () => {
    cy.contains(activeUser).click();
    cy.wait(1000);

    cy.contains('Edit Profile').click();
    cy.wait(1000);

    cy.get('[data-testid="checktextarea"]').clear().type(UserProfile.description);
    cy.wait(1000);

    cy.get('.euiFormLabel').contains('Coding Languages').click();

    for (let i = 0; i < UserProfile.coding_language.length; i++) {
      cy.get('#react-select-3-input').type(`${UserProfile.coding_language[i]}{enter}`, {
        force: true
      });
    }
    cy.get('body').click();
    cy.get('[data-testid="github"]').type(UserProfile.github);
    cy.wait(1000);

    cy.get('[data-testid="twitter"]').type(UserProfile.twitter);
    cy.wait(1000);

    cy.contains('Save').click();
    cy.wait(1000);

    // click outside the modal
    cy.get('body').click(0, 0);

    cy.logout(activeUser);
  });
});
