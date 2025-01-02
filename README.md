import pytest
from unittest import mock
from httpx import AsyncClient, Response
from uuid import uuid4

@pytest.mark.asyncio
async def test_get_blocking_vulnerability_criteria_for_all_tools():
    # Mock configuration and responses
    mock_validator_config = mock.Mock()  # Assuming this is the config class
    mock_blocking_vulnerability_response = {
        "SAST": [
            {
                "type": "SAST",
                "category": "SQL Injection",
                "tool": None,
                "identifiers": ["CWE-89", "CWE-564"],
                "levels": [],
                "



"levels": [],
                "minScore": 0,
                "maxScore": 100
            },
            {
                "type": "SAST",
                "category": "Buffer Overflow",
                "tool": None,
                "identifiers": ["CWE-119", "CWE-120"],
                "levels": [],
                "minScore": 0,
                "maxScore": 100
            }
        ]
    }

    mock_response = Response(
        status_code=200,
        json=mock_blocking_vulnerability_response
    )

    # Mock cache and HTTP client
    mock_cache = mock.AsyncMock()
    mock_cache.exists = mock.Mock(return_value=False)
    mock_cache.set = mock.AsyncMock()

    mock_http_client = mock.AsyncMock()
    mock_http_client.request = mock.AsyncMock(return_value=mock_response)

    # Create an instance of the client with mock dependencies
    policy_validator_client = PolicyValidatorServiceClient(
        pv_service_config=mock_validator_config,
        client=mock_http_client
    )

    # Mock the context manager for the client
    with mock.patch.object(
        PolicyValidatorServiceClient, "__aenter__", return_value=policy_validator_client
    ):
        async with policy_validator_client as pv_client:
            results = await pv_client.get_blocking_vulnerability_criteria_for_all_tools(
                transaction_id="KNOWN_TXN_ID"
            )

    # Assertions
    assert len(results) == len(mock_blocking_vulnerability_response)  # Ensure all tool types are returned
    assert "SAST" in results  # Ensure the key "SAST" exists
    assert results["SAST"] == mock_blocking_vulnerability_response["SAST"]  # Validate content

    # Verify the cache was updated
    mock_cache.set.assert_awaited_once_with("SAST", mock_blocking_vulnerability_response["SAST"])

    # Verify the HTTP request was made with the correct parameters
    mock_http_client.request.assert_awaited_once_with(
        method="GET",
        url=f"{mock_validator_config.base_url}/blocking-vulnerabilities",
        headers={"X-MS-Unique-Id": "KNOWN_TXN_ID"}
    )
