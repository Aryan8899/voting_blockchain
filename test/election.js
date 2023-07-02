const Election = artifacts.require("Election");

contract("Election", function (accounts) {
  let electionInstance;

  before(async function () {
    electionInstance = await Election.deployed();
  });

  it("initializes with two candidates", async function () {
    const candidatesCount = await electionInstance.candidatesCount();
    assert.equal(candidatesCount, 2);
  });

  it("initializes the candidates with the correct values", async function () {
    let candidate = await electionInstance.candidates(1);
    assert.equal(candidate[0], 1, "contains the correct id");
    assert.equal(candidate[1], "Candidate 1", "contains the correct name");
    assert.equal(candidate[2], 0, "contains the correct votes count");

    candidate = await electionInstance.candidates(2);
    assert.equal(candidate[0], 2, "contains the correct id");
    assert.equal(candidate[1], "Candidate 2", "contains the correct name");
    assert.equal(candidate[2], 0, "contains the correct votes count");
  });

  it("allows a voter to cast a vote", async function () {
    const candidateId = 1;
    const receipt = await electionInstance.vote(candidateId, {
      from: accounts[0],
    });

    assert.equal(receipt.logs.length, 1, "an event was triggered");
    assert.equal(
      receipt.logs[0].event.toLowerCase(),
      "votedevent",
      "the event type is correct"
    );
    assert.equal(
      receipt.logs[0].args._candidateId.toNumber(),
      candidateId,
      "the candidate id is correct"
    );

    const voted = await electionInstance.voters(accounts[0]);
    assert(voted, "the voter was marked as voted");

    const candidate = await electionInstance.candidates(candidateId);
    assert.equal(candidate[2], 1, "increments the candidate's vote count");
  });

  it("throws an exception for invalid candidates", async function () {
    try {
      await electionInstance.vote(99, { from: accounts[1] });
      assert.fail("Expected an exception to be thrown");
    } catch (error) {
      assert(
        error.message.indexOf("revert") >= 0,
        "error message must contain revert"
      );

      const candidate1 = await electionInstance.candidates(1);
      assert.equal(candidate1[2], 1, "candidate 1 did not receive any votes");

      const candidate2 = await electionInstance.candidates(2);
      assert.equal(candidate2[2], 0, "candidate 2 did not receive any votes");
    }
  });

  it("throws an exception for double voting", async function () {
    const candidateId = 2;
    await electionInstance.vote(candidateId, { from: accounts[1] });
    const candidate = await electionInstance.candidates(candidateId);
    assert.equal(candidate[2], 1, "accepts first vote");

    try {
      await electionInstance.vote(candidateId, { from: accounts[1] });
      assert.fail("Expected an exception to be thrown");
    } catch (error) {
      assert(
        error.message.indexOf("revert") >= 0,
        "error message must contain revert"
      );

      const candidate1 = await electionInstance.candidates(1);
      assert.equal(candidate1[2], 1, "candidate 1 did not receive any votes");

      const candidate2 = await electionInstance.candidates(2);
      assert.equal(candidate2[2], 1, "candidate 2 did not receive any votes");
    }
  });
});
