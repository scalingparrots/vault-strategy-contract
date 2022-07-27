/// Copyright (c) 2022 tokens ltd.
/// opensource@tokens.com
/// SPDX-License-Identifier: MIT
/// Licensed under the MIT License;
/// You may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
/// https://github.com/tokens/contracts/blob/main/LICENSE
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.

pragma solidity ^0.8.13;

interface ILiquidityGauge {
  function balanceOf(address account) external view returns (uint256);

  /**
   * @param _value Number of tokens to deposit
  **/
  function deposit(uint256 _value) external;

  /**
   * @param _value Number of tokens to deposit
   * @param _recipient Address to deposit for
  **/
  function deposit(uint256 _value, address _recipient) external;

  function withdraw(uint256 _value) external;
  function claim_rewards(address _addr) external;
}
